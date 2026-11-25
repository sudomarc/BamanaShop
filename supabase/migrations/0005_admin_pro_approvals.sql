-- Admin review queue for Pro seller and courier applications.

ALTER TABLE public.seller_profiles
  ADD COLUMN review_note TEXT;

ALTER TABLE public.courier_profiles
  ADD COLUMN review_note TEXT;

-- Review notes are approval metadata and cannot be edited by the applicant.
CREATE OR REPLACE FUNCTION private.protect_seller_profile_approval()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $function$
BEGIN
  IF current_user IN ('postgres', 'service_role')
     OR EXISTS (
       SELECT 1
       FROM public.role_memberships AS admin_role
       WHERE admin_role.user_id = auth.uid()
         AND admin_role.role = 'admin'::public.user_role
         AND admin_role.status = 'approved'::public.role_status
     ) THEN
    IF TG_OP = 'UPDATE'
       AND OLD.status = 'rejected'::public.role_status
       AND NEW.status = 'pending'::public.role_status THEN
      NEW.review_note := NULL;
    END IF;
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    IF NEW.status <> 'pending'::public.role_status
       OR NEW.approved_by IS NOT NULL
       OR NEW.approved_at IS NOT NULL
       OR NEW.review_note IS NOT NULL THEN
      RAISE EXCEPTION 'Seller approval fields are managed by BamanaShop'
        USING ERRCODE = '42501';
    END IF;
  ELSIF NEW.status IS DISTINCT FROM OLD.status
     OR NEW.approved_by IS DISTINCT FROM OLD.approved_by
     OR NEW.approved_at IS DISTINCT FROM OLD.approved_at
     OR NEW.review_note IS DISTINCT FROM OLD.review_note
     OR NEW.business_activities IS DISTINCT FROM OLD.business_activities
     OR NEW.business_details IS DISTINCT FROM OLD.business_details THEN
    RAISE EXCEPTION 'Seller approval and activity fields are managed by BamanaShop'
      USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION private.protect_courier_profile_approval()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $function$
BEGIN
  IF current_user IN ('postgres', 'service_role')
     OR EXISTS (
       SELECT 1
       FROM public.role_memberships AS admin_role
       WHERE admin_role.user_id = auth.uid()
         AND admin_role.role = 'admin'::public.user_role
         AND admin_role.status = 'approved'::public.role_status
     ) THEN
    IF TG_OP = 'UPDATE'
       AND OLD.status = 'rejected'::public.role_status
       AND NEW.status = 'pending'::public.role_status THEN
      NEW.review_note := NULL;
    END IF;
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    IF NEW.status <> 'pending'::public.role_status
       OR NEW.approved_by IS NOT NULL
       OR NEW.approved_at IS NOT NULL
       OR NEW.review_note IS NOT NULL THEN
      RAISE EXCEPTION 'Courier approval fields are managed by BamanaShop'
        USING ERRCODE = '42501';
    END IF;
  ELSIF NEW.status IS DISTINCT FROM OLD.status
     OR NEW.approved_by IS DISTINCT FROM OLD.approved_by
     OR NEW.approved_at IS DISTINCT FROM OLD.approved_at
     OR NEW.review_note IS DISTINCT FROM OLD.review_note THEN
    RAISE EXCEPTION 'Courier approval fields are managed by BamanaShop'
      USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.admin_list_pending_pro_applications()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  v_admin_id UUID := auth.uid();
  v_applications JSONB;
BEGIN
  IF v_admin_id IS NULL OR NOT EXISTS (
    SELECT 1
    FROM public.role_memberships AS admin_role
    WHERE admin_role.user_id = v_admin_id
      AND admin_role.role = 'admin'::public.user_role
      AND admin_role.status = 'approved'::public.role_status
  ) THEN
    RAISE EXCEPTION 'Administrator access required'
      USING ERRCODE = '42501';
  END IF;

  SELECT COALESCE(
    pg_catalog.jsonb_agg(
      pg_catalog.jsonb_build_object(
        'user_id', membership.user_id,
        'role', membership.role,
        'membership_status', membership.status,
        'submitted_at', membership.updated_at,
        'profile', pg_catalog.jsonb_build_object(
          'email', auth_user.email,
          'full_name', profile.full_name,
          'phone', profile.phone
        ),
        'seller_profile', CASE
          WHEN membership.role = 'seller'::public.user_role THEN
            pg_catalog.jsonb_build_object(
              'business_name', seller.business_name,
              'business_activities', seller.business_activities,
              'business_details', seller.business_details,
              'status', seller.status,
              'review_note', seller.review_note,
              'created_at', seller.created_at
            )
          ELSE NULL
        END,
        'courier_profile', CASE
          WHEN membership.role = 'courier'::public.user_role THEN
            pg_catalog.jsonb_build_object(
              'vehicle_type', courier.vehicle_type,
              'vehicle_plate', courier.vehicle_plate,
              'status', courier.status,
              'review_note', courier.review_note,
              'created_at', courier.created_at
            )
          ELSE NULL
        END
      )
      ORDER BY membership.created_at ASC
    ),
    '[]'::JSONB
  )
  INTO v_applications
  FROM public.role_memberships AS membership
  JOIN auth.users AS auth_user
    ON auth_user.id = membership.user_id
  LEFT JOIN public.profiles AS profile
    ON profile.id = membership.user_id
  LEFT JOIN public.seller_profiles AS seller
    ON seller.user_id = membership.user_id
  LEFT JOIN public.courier_profiles AS courier
    ON courier.user_id = membership.user_id
  WHERE membership.role IN (
      'seller'::public.user_role,
      'courier'::public.user_role
    )
    AND membership.status = 'pending'::public.role_status;

  RETURN v_applications;
END;
$function$;

CREATE OR REPLACE FUNCTION public.admin_review_pro_application(
  p_user_id UUID,
  p_role public.user_role,
  p_decision TEXT,
  p_reason TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  v_admin_id UUID := auth.uid();
  v_next_status public.role_status;
  v_reason TEXT := NULLIF(pg_catalog.btrim(p_reason), '');
  v_profile_id UUID;
BEGIN
  IF v_admin_id IS NULL OR NOT EXISTS (
    SELECT 1
    FROM public.role_memberships AS admin_role
    WHERE admin_role.user_id = v_admin_id
      AND admin_role.role = 'admin'::public.user_role
      AND admin_role.status = 'approved'::public.role_status
  ) THEN
    RAISE EXCEPTION 'Administrator access required'
      USING ERRCODE = '42501';
  END IF;

  IF p_role IS NULL OR p_role NOT IN (
    'seller'::public.user_role,
    'courier'::public.user_role
  ) THEN
    RAISE EXCEPTION 'Only seller and courier applications can be reviewed'
      USING ERRCODE = '22023';
  END IF;

  IF p_decision IS NULL OR p_decision NOT IN ('approve', 'reject') THEN
    RAISE EXCEPTION 'Decision must be approve or reject'
      USING ERRCODE = '22023';
  END IF;

  IF p_decision = 'reject'
     AND (v_reason IS NULL OR pg_catalog.length(v_reason) < 5 OR pg_catalog.length(v_reason) > 500) THEN
    RAISE EXCEPTION 'A rejection reason between 5 and 500 characters is required'
      USING ERRCODE = '22023';
  END IF;

  v_next_status := CASE
    WHEN p_decision = 'approve' THEN 'approved'::public.role_status
    ELSE 'rejected'::public.role_status
  END;

  UPDATE public.role_memberships
  SET status = v_next_status,
      approved_by = CASE WHEN p_decision = 'approve' THEN v_admin_id ELSE NULL END,
      approved_at = CASE WHEN p_decision = 'approve' THEN pg_catalog.now() ELSE NULL END,
      updated_at = pg_catalog.now()
  WHERE user_id = p_user_id
    AND role = p_role
    AND status = 'pending'::public.role_status;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'No pending application exists for this user and role'
      USING ERRCODE = 'P0002';
  END IF;

  IF p_role = 'seller'::public.user_role THEN
    UPDATE public.seller_profiles
    SET status = v_next_status,
        approved_by = CASE WHEN p_decision = 'approve' THEN v_admin_id ELSE NULL END,
        approved_at = CASE WHEN p_decision = 'approve' THEN pg_catalog.now() ELSE NULL END,
        review_note = CASE WHEN p_decision = 'reject' THEN v_reason ELSE NULL END,
        updated_at = pg_catalog.now()
    WHERE user_id = p_user_id
    RETURNING id INTO v_profile_id;
  ELSE
    UPDATE public.courier_profiles
    SET status = v_next_status,
        approved_by = CASE WHEN p_decision = 'approve' THEN v_admin_id ELSE NULL END,
        approved_at = CASE WHEN p_decision = 'approve' THEN pg_catalog.now() ELSE NULL END,
        review_note = CASE WHEN p_decision = 'reject' THEN v_reason ELSE NULL END,
        updated_at = pg_catalog.now()
    WHERE user_id = p_user_id
    RETURNING id INTO v_profile_id;
  END IF;

  IF v_profile_id IS NULL THEN
    RAISE EXCEPTION 'The associated Pro profile does not exist'
      USING ERRCODE = 'P0002';
  END IF;

  RETURN pg_catalog.jsonb_build_object(
    'user_id', p_user_id,
    'role', p_role,
    'status', v_next_status,
    'reviewed_by', v_admin_id
  );
END;
$function$;

REVOKE ALL ON FUNCTION public.admin_list_pending_pro_applications()
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_list_pending_pro_applications()
  TO authenticated;

REVOKE ALL ON FUNCTION public.admin_review_pro_application(
  UUID, public.user_role, TEXT, TEXT
) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_review_pro_application(
  UUID, public.user_role, TEXT, TEXT
) TO authenticated;

DO $admin_approval_assertions$
BEGIN
  IF pg_catalog.has_function_privilege(
    'anon',
    'public.admin_list_pending_pro_applications()',
    'EXECUTE'
  ) OR NOT pg_catalog.has_function_privilege(
    'authenticated',
    'public.admin_list_pending_pro_applications()',
    'EXECUTE'
  ) OR pg_catalog.has_function_privilege(
    'anon',
    'public.admin_review_pro_application(uuid, public.user_role, text, text)',
    'EXECUTE'
  ) OR NOT pg_catalog.has_function_privilege(
    'authenticated',
    'public.admin_review_pro_application(uuid, public.user_role, text, text)',
    'EXECUTE'
  ) THEN
    RAISE EXCEPTION 'Admin Pro review RPC permissions are not correctly restricted';
  END IF;
END;
$admin_approval_assertions$;
