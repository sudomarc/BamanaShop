import { describe, expect, it } from "vitest";
import { getProAccessDecision } from "../utils/proAccess";

const base = {
  backendConfigured: true,
  initialized: true,
  userId: "user-1",
  profileLoading: false,
  profileError: null,
  approvedRoles: [],
  selectedRole: null,
};

describe("Pro role access gate", () => {
  it("blocks the app when backend configuration is missing", () => {
    expect(
      getProAccessDecision({ ...base, backendConfigured: false }),
    ).toEqual({ kind: "backend-unavailable" });
  });

  it("shows loading until the session is initialized", () => {
    expect(
      getProAccessDecision({ ...base, initialized: false }),
    ).toEqual({ kind: "loading" });
  });

  it("requires sign-in when there is no authenticated user", () => {
    expect(getProAccessDecision({ ...base, userId: null })).toEqual({
      kind: "sign-in",
    });
  });

  it("blocks accounts without an approved Pro role", () => {
    expect(getProAccessDecision(base)).toEqual({
      kind: "no-approved-role",
    });
  });

  it("blocks on profile lookup errors rather than exposing a dashboard", () => {
    expect(
      getProAccessDecision({ ...base, profileError: "RLS denied profile read" }),
    ).toEqual({
      kind: "profile-error",
      message: "RLS denied profile read",
    });
  });

  it("opens only the seller surface for an approved seller", () => {
    expect(
      getProAccessDecision({ ...base, approvedRoles: ["seller"] }),
    ).toEqual({ kind: "seller" });
  });

  it("opens only the courier surface for an approved courier", () => {
    expect(
      getProAccessDecision({ ...base, approvedRoles: ["courier"] }),
    ).toEqual({ kind: "courier" });
  });

  it("requires an explicit choice when both Pro roles are approved", () => {
    expect(
      getProAccessDecision({
        ...base,
        approvedRoles: ["seller", "courier"],
      }),
    ).toEqual({ kind: "choose-role", roles: ["seller", "courier"] });
  });

  it("does not grant a Pro dashboard to non-Pro roles", () => {
    expect(
      getProAccessDecision({
        ...base,
        approvedRoles: ["customer", "staff"],
      }),
    ).toEqual({ kind: "no-approved-role" });
  });

  it("ignores a selected role that is not approved", () => {
    expect(
      getProAccessDecision({
        ...base,
        approvedRoles: ["seller"],
        selectedRole: "courier",
      }),
    ).toEqual({ kind: "seller" });
  });
});
