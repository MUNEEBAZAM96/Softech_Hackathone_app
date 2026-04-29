/**
 * All finance SQL must run with a non-empty authenticated user id (Clerk `userId`).
 */

export function assertFinanceUserId(
  id: string | null | undefined
): asserts id is string {
  if (typeof id !== "string" || id.trim().length === 0) {
    throw new Error("Finance operations require a signed-in user id.");
  }
}

export function requireFinanceUserId(id: string | null | undefined): string {
  assertFinanceUserId(id);
  return id.trim();
}
