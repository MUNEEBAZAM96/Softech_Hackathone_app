import type { SetActive } from "@clerk/types";
import type { StartSSOFlowReturnType } from "@clerk/clerk-expo";

export type ContinueWithGoogleResult =
  | { ok: true }
  | { ok: false; reason: "cancelled" }
  | { ok: false; reason: "not_ready" }
  | { ok: false; reason: "no_session"; message: string }
  | { ok: false; reason: "clerk_error"; message: string };

type StartSSOFlow = (params: {
  strategy: "oauth_google";
  redirectUrl?: string;
}) => Promise<StartSSOFlowReturnType>;

function clerkMessage(err: unknown): string | null {
  if (!err || typeof err !== "object") return null;
  const errors = (err as { errors?: { message?: string }[] }).errors;
  if (!Array.isArray(errors) || !errors[0]?.message) return null;
  return errors[0].message;
}

/**
 * Runs Clerk Expo Google SSO (`useSSO` + native auth session) and activates the session on success.
 * Caller handles navigation after `ok: true`.
 */
export async function continueWithGoogleFlow(
  startSSOFlow: StartSSOFlow,
  setActive: SetActive | undefined
): Promise<ContinueWithGoogleResult> {
  try {
    if (!setActive) {
      return { ok: false, reason: "not_ready" };
    }
    const { createdSessionId, authSessionResult } = await startSSOFlow({
      strategy: "oauth_google",
    });

    if (!authSessionResult) {
      return { ok: false, reason: "not_ready" };
    }

    if (
      authSessionResult.type === "cancel" ||
      authSessionResult.type === "dismiss"
    ) {
      return { ok: false, reason: "cancelled" };
    }

    if (authSessionResult.type !== "success" || !createdSessionId) {
      const message =
        authSessionResult.type === "locked"
          ? "Another sign-in session may be open. Close it and try again."
          : "Could not complete Google sign-in. Please try again.";
      return { ok: false, reason: "no_session", message };
    }

    await setActive({ session: createdSessionId });
    return { ok: true };
  } catch (err: unknown) {
    const message =
      clerkMessage(err) ?? "Something went wrong. Please try again.";
    return { ok: false, reason: "clerk_error", message };
  }
}
