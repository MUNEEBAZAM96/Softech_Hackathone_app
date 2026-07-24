import { Platform } from "react-native";
import Purchases, {
  LOG_LEVEL,
  PURCHASES_ERROR_CODE,
  type CustomerInfo,
  type CustomerInfoUpdateListener,
  type PurchasesOfferings,
  type PurchasesPackage,
} from "react-native-purchases";

/** RevenueCat entitlement that unlocks the AI features. */
export const PRO_ENTITLEMENT_ID = "pro";

export type PurchaseOutcome = {
  customerInfo: CustomerInfo | null;
  /** True when the user dismissed the native purchase sheet — not an error. */
  userCancelled: boolean;
};

let configured = false;

export function isRevenueCatConfigured(): boolean {
  return configured;
}

/**
 * Configure the RevenueCat SDK once at app startup.
 * Returns false (and leaves the app in free mode) when the API key is missing
 * or the platform has no store (web / Expo Go without a dev build).
 */
export function initRevenueCat(): boolean {
  if (configured) return true;

  const apiKey = process.env.EXPO_PUBLIC_REVENUECAT_API_KEY;
  if (!apiKey) {
    console.warn(
      "[subscription] EXPO_PUBLIC_REVENUECAT_API_KEY is not set — premium features stay locked."
    );
    return false;
  }
  if (Platform.OS !== "ios" && Platform.OS !== "android") {
    return false;
  }

  try {
    if (__DEV__) {
      Purchases.setLogLevel(LOG_LEVEL.WARN);
    }
    Purchases.configure({ apiKey });
    configured = true;
    return true;
  } catch (e) {
    console.warn("[subscription] Failed to configure RevenueCat:", e);
    return false;
  }
}

/** Link the RevenueCat customer to the Clerk user so entitlements follow the account. */
export async function identifyUser(
  clerkUserId: string
): Promise<CustomerInfo | null> {
  if (!configured) return null;
  try {
    const { customerInfo } = await Purchases.logIn(clerkUserId);
    return customerInfo;
  } catch (e) {
    console.warn("[subscription] RevenueCat logIn failed:", e);
    return null;
  }
}

/** Reset the RevenueCat identity on sign-out (safe to call when anonymous). */
export async function logOutRevenueCat(): Promise<void> {
  if (!configured) return;
  try {
    await Purchases.logOut();
  } catch {
    /* logOut throws for anonymous users — nothing to reset */
  }
}

export function hasProEntitlement(info: CustomerInfo | null): boolean {
  return Boolean(info?.entitlements.active[PRO_ENTITLEMENT_ID]);
}

/** One-shot entitlement check against the current customer. */
export async function checkProEntitlement(): Promise<boolean> {
  if (!configured) return false;
  try {
    const info = await Purchases.getCustomerInfo();
    return hasProEntitlement(info);
  } catch (e) {
    console.warn("[subscription] getCustomerInfo failed:", e);
    return false;
  }
}

/** Fetch offerings for the paywall; null when unavailable (offline / not configured). */
export async function getOfferings(): Promise<PurchasesOfferings | null> {
  if (!configured) return null;
  try {
    return await Purchases.getOfferings();
  } catch (e) {
    console.warn("[subscription] getOfferings failed:", e);
    return null;
  }
}

/**
 * Run the native purchase flow for a package.
 * Cancellation is reported via `userCancelled`; real failures re-throw so the
 * paywall can surface the store error message.
 */
export async function purchaseSubscriptionPackage(
  pkg: PurchasesPackage
): Promise<PurchaseOutcome> {
  if (!configured) {
    throw new Error("Purchases are not available right now.");
  }
  try {
    const { customerInfo } = await Purchases.purchasePackage(pkg);
    return { customerInfo, userCancelled: false };
  } catch (e) {
    const err = e as { userCancelled?: boolean; code?: string };
    if (
      err.userCancelled === true ||
      err.code === PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR
    ) {
      return { customerInfo: null, userCancelled: true };
    }
    throw e;
  }
}

/** Restore previous purchases (device switch / reinstall). */
export async function restorePurchases(): Promise<CustomerInfo | null> {
  if (!configured) return null;
  return Purchases.restorePurchases();
}

/** Subscribe to customer info changes; returns an unsubscribe function. */
export function addCustomerInfoListener(
  onUpdate: (info: CustomerInfo) => void
): () => void {
  if (!configured) return () => {};
  const listener: CustomerInfoUpdateListener = onUpdate;
  Purchases.addCustomerInfoUpdateListener(listener);
  return () => {
    Purchases.removeCustomerInfoUpdateListener(listener);
  };
}
