/**
 * Legacy on-device user id from pre–Clerk single-user builds (migrations / one-time reassignment only).
 * All new reads/writes must use Clerk `userId` via `requireFinanceUserId`.
 */
export const LEGACY_LOCAL_USER_ID = "local";
