-- Pro business onboarding: validated multi-activity applications and server-managed approvals.

ALTER TABLE public.seller_profiles
  ADD COLUMN business_activities TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN business_details JSONB NOT NULL DEFAULT '{}';

ALTER TABLE public.seller_profiles
  ADD CONSTRAINT seller_profiles_business_activities_check
    CHECK (
      business_activities <@ ARRAY[
        'physical_store',
        'online_seller',
        'wholesaler',
        'distributor'
      ]::TEXT[]
    ),
  ADD CONSTRAINT seller_profiles_business_details_object_check
    CHECK (pg_catalog.jsonb_typeof(business_details) = 'object');

-- Keep approval state and submitted activity configuration server-managed.
CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC, anon, authenticated;
GRANT USAGE ON SCHEMA private TO authenticated;

CREATE OR REPLACE FUNCTION private.protect_seller_profile_approval()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $function$
BEGIN
  IF current_user IN ('postgres', 'service_role')
     OR public.is_admin() THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    IF NEW.status <> 'pending'::public.role_status
       OR NEW.approved_by IS NOT NULL
       OR NEW.approved_at IS NOT NULL THEN
      RAISE EXCEPTION 'Seller approval fields are managed by BamanaShop'
        USING ERRCODE = '42501';
    END IF;
  ELSIF NEW.status IS DISTINCT FROM OLD.status
     OR NEW.approved_by IS DISTINCT FROM OLD.approved_by
     OR NEW.approved_at IS DISTINCT FROM OLD.approved_at
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
     OR public.is_admin() THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    IF NEW.status <> 'pending'::public.role_status
       OR NEW.approved_by IS NOT NULL
       OR NEW.approved_at IS NOT NULL THEN
      RAISE EXCEPTION 'Courier approval fields are managed by BamanaShop'
        USING ERRCODE = '42501';
    END IF;
  ELSIF NEW.status IS DISTINCT FROM OLD.status
     OR NEW.approved_by IS DISTINCT FROM OLD.approved_by
     OR NEW.approved_at IS DISTINCT FROM OLD.approved_at THEN
    RAISE EXCEPTION 'Courier approval fields are managed by BamanaShop'
      USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS protect_seller_profile_approval ON public.seller_profiles;
CREATE TRIGGER protect_seller_profile_approval
BEFORE INSERT OR UPDATE ON public.seller_profiles
FOR EACH ROW
EXECUTE FUNCTION private.protect_seller_profile_approval();

DROP TRIGGER IF EXISTS protect_courier_profile_approval ON public.courier_profiles;
CREATE TRIGGER protect_courier_profile_approval
BEFORE INSERT OR UPDATE ON public.courier_profiles
FOR EACH ROW
EXECUTE FUNCTION private.protect_courier_profile_approval();

CREATE OR REPLACE FUNCTION private.request_pro_access(
  p_full_name TEXT,
  p_phone TEXT,
  p_business_name TEXT,
  p_business_activities TEXT[],
  p_business_details JSONB,
  p_courier_requested BOOLEAN,
  p_vehicle_type TEXT,
  p_vehicle_plate TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  v_user_id UUID := auth.uid();
  v_activities TEXT[] := COALESCE(p_business_activities, ARRAY[]::TEXT[]);
  v_details JSONB := COALESCE(p_business_details, '{}'::JSONB);
  v_seller_status public.role_status;
  v_courier_status public.role_status;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required' USING ERRCODE = '28000';
  END IF;

  IF p_full_name IS NULL
     OR pg_catalog.length(pg_catalog.btrim(p_full_name)) < 2
     OR pg_catalog.length(pg_catalog.btrim(p_full_name)) > 120 THEN
    RAISE EXCEPTION 'Full name must contain between 2 and 120 characters'
      USING ERRCODE = '22023';
  END IF;

  IF p_phone IS NULL OR p_phone !~ '^\\+224[0-9]{9}$' THEN
    RAISE EXCEPTION 'A valid Guinean phone number is required'
      USING ERRCODE = '22023';
  END IF;

  IF pg_catalog.cardinality(v_activities) > 4
     OR pg_catalog.array_position(v_activities, NULL) IS NOT NULL
     OR NOT (
       v_activities <@ ARRAY[
         'physical_store',
         'online_seller',
         'wholesaler',
         'distributor'
       ]::TEXT[]
     )
     OR pg_catalog.cardinality(v_activities) <> (
       SELECT pg_catalog.count(DISTINCT activity_name)
       FROM pg_catalog.unnest(v_activities) AS activities(activity_name)
     ) THEN
    RAISE EXCEPTION 'One or more business activities are invalid or duplicated'
      USING ERRCODE = '22023';
  END IF;

  IF pg_catalog.cardinality(v_activities) = 0 AND NOT COALESCE(p_courier_requested, FALSE) THEN
    RAISE EXCEPTION 'Select at least one business activity or courier access'
      USING ERRCODE = '22023';
  END IF;

  IF pg_catalog.cardinality(v_activities) > 0 THEN
    IF p_business_name IS NULL
       OR pg_catalog.length(pg_catalog.btrim(p_business_name)) < 2
       OR pg_catalog.length(pg_catalog.btrim(p_business_name)) > 200 THEN
      RAISE EXCEPTION 'Business name must contain between 2 and 200 characters'
        USING ERRCODE = '22023';
    END IF;

    IF pg_catalog.jsonb_typeof(v_details) IS DISTINCT FROM 'object' THEN
      RAISE EXCEPTION 'Business activity details must be a JSON object'
        USING ERRCODE = '22023';
    END IF;

    IF 'physical_store' = ANY(v_activities) AND (
      NULLIF(pg_catalog.btrim(v_details->'physical_store'->>'commune'), '') IS NULL
      OR NULLIF(pg_catalog.btrim(v_details->'physical_store'->>'quartier'), '') IS NULL
      OR NULLIF(pg_catalog.btrim(v_details->'physical_store'->>'address_line'), '') IS NULL
    ) THEN
      RAISE EXCEPTION 'Physical store details require commune, quartier and address'
        USING ERRCODE = '22023';
    END IF;

    IF 'online_seller' = ANY(v_activities) AND (
      CASE
        WHEN pg_catalog.jsonb_typeof(v_details->'online_seller'->'channels') = 'array'
          THEN pg_catalog.jsonb_array_length(v_details->'online_seller'->'channels') > 0
        ELSE FALSE
      END IS NOT TRUE
      OR CASE
        WHEN pg_catalog.jsonb_typeof(v_details->'online_seller'->'delivery_zones') = 'array'
          THEN pg_catalog.jsonb_array_length(v_details->'online_seller'->'delivery_zones') > 0
        ELSE FALSE
      END IS NOT TRUE
    ) THEN
      RAISE EXCEPTION 'Online seller details require sales channels and delivery zones'
        USING ERRCODE = '22023';
    END IF;

    IF 'wholesaler' = ANY(v_activities) AND (
      CASE
        WHEN pg_catalog.jsonb_typeof(v_details->'wholesaler'->'goods') = 'array'
          THEN pg_catalog.jsonb_array_length(v_details->'wholesaler'->'goods') > 0
        ELSE FALSE
      END IS NOT TRUE
      OR CASE
        WHEN pg_catalog.jsonb_typeof(v_details->'wholesaler'->'minimum_order_gnf') = 'number'
          THEN (v_details->'wholesaler'->>'minimum_order_gnf')::NUMERIC > 0
        ELSE FALSE
      END IS NOT TRUE
    ) THEN
      RAISE EXCEPTION 'Wholesaler details require goods and a positive minimum order'
        USING ERRCODE = '22023';
    END IF;

    IF 'distributor' = ANY(v_activities) AND (
      CASE
        WHEN pg_catalog.jsonb_typeof(v_details->'distributor'->'suppliers') = 'array'
          THEN pg_catalog.jsonb_array_length(v_details->'distributor'->'suppliers') > 0
        ELSE FALSE
      END IS NOT TRUE
      OR CASE
        WHEN pg_catalog.jsonb_typeof(v_details->'distributor'->'distribution_zones') = 'array'
          THEN pg_catalog.jsonb_array_length(v_details->'distributor'->'distribution_zones') > 0
        ELSE FALSE
      END IS NOT TRUE
    ) THEN
      RAISE EXCEPTION 'Distributor details require suppliers and distribution zones'
        USING ERRCODE = '22023';
    END IF;
  END IF;

  IF COALESCE(p_courier_requested, FALSE)
     AND (
       p_vehicle_type IS NULL
       OR p_vehicle_type NOT IN ('motorcycle', 'bicycle', 'car', 'walking')
     ) THEN
    RAISE EXCEPTION 'Select a valid courier vehicle type'
      USING ERRCODE = '22023';
  END IF;

  IF p_vehicle_plate IS NOT NULL
     AND pg_catalog.length(pg_catalog.btrim(p_vehicle_plate)) > 20 THEN
    RAISE EXCEPTION 'Vehicle plate must not exceed 20 characters'
      USING ERRCODE = '22023';
  END IF;

  INSERT INTO public.profiles (id, phone, full_name, updated_at)
  VALUES (
    v_user_id,
    pg_catalog.btrim(p_phone),
    pg_catalog.btrim(p_full_name),
    pg_catalog.now()
  )
  ON CONFLICT (id) DO UPDATE
  SET phone = EXCLUDED.phone,
      full_name = EXCLUDED.full_name,
      updated_at = pg_catalog.now();

  IF pg_catalog.cardinality(v_activities) > 0 THEN
    INSERT INTO public.seller_profiles (
      user_id,
      business_name,
      business_activities,
      business_details,
      status,
      created_at,
      updated_at
    ) VALUES (
      v_user_id,
      pg_catalog.btrim(p_business_name),
      v_activities,
      v_details,
      'pending',
      pg_catalog.now(),
      pg_catalog.now()
    )
    ON CONFLICT (user_id) DO UPDATE
    SET business_name = EXCLUDED.business_name,
        business_activities = EXCLUDED.business_activities,
        business_details = EXCLUDED.business_details,
        status = CASE
          WHEN public.seller_profiles.status = 'rejected'::public.role_status
            THEN 'pending'::public.role_status
          ELSE public.seller_profiles.status
        END,
        updated_at = pg_catalog.now()
    RETURNING status INTO v_seller_status;

    INSERT INTO public.role_memberships (user_id, role, status)
    VALUES (v_user_id, 'seller', 'pending')
    ON CONFLICT (user_id, role) DO UPDATE
    SET status = CASE
          WHEN public.role_memberships.status = 'rejected'::public.role_status
            THEN 'pending'::public.role_status
          ELSE public.role_memberships.status
        END,
        updated_at = pg_catalog.now();
  END IF;

  IF COALESCE(p_courier_requested, FALSE) THEN
    INSERT INTO public.courier_profiles (
      user_id,
      vehicle_type,
      vehicle_plate,
      status,
      created_at,
      updated_at
    ) VALUES (
      v_user_id,
      p_vehicle_type,
      NULLIF(pg_catalog.btrim(p_vehicle_plate), ''),
      'pending',
      pg_catalog.now(),
      pg_catalog.now()
    )
    ON CONFLICT (user_id) DO UPDATE
    SET vehicle_type = EXCLUDED.vehicle_type,
        vehicle_plate = EXCLUDED.vehicle_plate,
        status = CASE
          WHEN public.courier_profiles.status = 'rejected'::public.role_status
            THEN 'pending'::public.role_status
          ELSE public.courier_profiles.status
        END,
        updated_at = pg_catalog.now()
    RETURNING status INTO v_courier_status;

    INSERT INTO public.role_memberships (user_id, role, status)
    VALUES (v_user_id, 'courier', 'pending')
    ON CONFLICT (user_id, role) DO UPDATE
    SET status = CASE
          WHEN public.role_memberships.status = 'rejected'::public.role_status
            THEN 'pending'::public.role_status
          ELSE public.role_memberships.status
        END,
        updated_at = pg_catalog.now();
  END IF;

  RETURN pg_catalog.jsonb_build_object(
    'seller_status', v_seller_status,
    'courier_status', v_courier_status
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.request_pro_access(
  p_full_name TEXT,
  p_phone TEXT,
  p_business_name TEXT,
  p_business_activities TEXT[],
  p_business_details JSONB,
  p_courier_requested BOOLEAN,
  p_vehicle_type TEXT,
  p_vehicle_plate TEXT
)
RETURNS JSONB
LANGUAGE sql
SECURITY INVOKER
SET search_path = ''
AS $function$
  SELECT private.request_pro_access(
    p_full_name,
    p_phone,
    p_business_name,
    p_business_activities,
    p_business_details,
    p_courier_requested,
    p_vehicle_type,
    p_vehicle_plate
  );
$function$;

REVOKE ALL ON FUNCTION private.protect_seller_profile_approval()
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION private.protect_courier_profile_approval()
  FROM PUBLIC, anon, authenticated;

REVOKE ALL ON FUNCTION private.request_pro_access(
  TEXT, TEXT, TEXT, TEXT[], JSONB, BOOLEAN, TEXT, TEXT
) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION private.request_pro_access(
  TEXT, TEXT, TEXT, TEXT[], JSONB, BOOLEAN, TEXT, TEXT
) TO authenticated;

REVOKE ALL ON FUNCTION public.request_pro_access(
  TEXT, TEXT, TEXT, TEXT[], JSONB, BOOLEAN, TEXT, TEXT
) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.request_pro_access(
  TEXT, TEXT, TEXT, TEXT[], JSONB, BOOLEAN, TEXT, TEXT
) TO authenticated;

DO $onboarding_assertions$
BEGIN
  IF pg_catalog.has_function_privilege(
    'anon',
    'public.request_pro_access(text, text, text, text[], jsonb, boolean, text, text)',
    'EXECUTE'
  ) OR NOT pg_catalog.has_function_privilege(
    'authenticated',
    'public.request_pro_access(text, text, text, text[], jsonb, boolean, text, text)',
    'EXECUTE'
  ) THEN
    RAISE EXCEPTION 'Pro onboarding RPC permissions are not correctly restricted';
  END IF;
END;
$onboarding_assertions$;
