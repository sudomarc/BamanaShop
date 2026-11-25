import type { UserRole } from "@bamanashop/contracts";

export type ProRole = Extract<UserRole, "seller" | "courier">;

export type ProAccessInput = {
  backendConfigured: boolean;
  initialized: boolean;
  userId: string | null;
  profileLoading: boolean;
  profileError: string | null;
  approvedRoles: UserRole[];
  selectedRole: UserRole | null;
};

export type ProAccessDecision =
  | { kind: "backend-unavailable" }
  | { kind: "loading" }
  | { kind: "sign-in" }
  | { kind: "profile-error"; message: string }
  | { kind: "no-approved-role" }
  | { kind: "choose-role"; roles: ProRole[] }
  | { kind: "seller" }
  | { kind: "courier" };

/**
 * Decide which Pro surface may be rendered from authenticated, approved roles.
 * Customer, staff and partner-manager roles do not grant Seller/Courier access.
 */
export function getProAccessDecision(
  input: ProAccessInput,
): ProAccessDecision {
  if (!input.backendConfigured) return { kind: "backend-unavailable" };
  if (!input.initialized || input.profileLoading) return { kind: "loading" };
  if (!input.userId) return { kind: "sign-in" };
  if (input.profileError) {
    return { kind: "profile-error", message: input.profileError };
  }

  const availableRoles = input.approvedRoles.filter(
    (role): role is ProRole => role === "seller" || role === "courier",
  );

  if (availableRoles.length === 0) return { kind: "no-approved-role" };

  if (
    input.selectedRole === "seller" &&
    availableRoles.includes("seller")
  ) {
    return { kind: "seller" };
  }

  if (
    input.selectedRole === "courier" &&
    availableRoles.includes("courier")
  ) {
    return { kind: "courier" };
  }

  if (availableRoles.length === 1) {
    return availableRoles[0] === "seller"
      ? { kind: "seller" }
      : { kind: "courier" };
  }

  return { kind: "choose-role", roles: availableRoles };
}
