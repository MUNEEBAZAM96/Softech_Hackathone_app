import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useAuth } from "@clerk/clerk-expo";
import type {
  PurchasesOfferings,
  PurchasesPackage,
} from "react-native-purchases";

import {
  addCustomerInfoListener,
  getOfferings,
  hasProEntitlement,
  identifyUser,
  initRevenueCat,
  purchaseSubscriptionPackage,
  restorePurchases as restorePurchasesService,
} from "../services/subscriptionService";

export type SubscriptionContextValue = {
  /** Active "pro" entitlement on the current customer. */
  isPro: boolean;
  /** True while the initial entitlement check for the signed-in user runs. */
  isLoading: boolean;
  /** False when the SDK could not start (missing key / unsupported platform). */
  isConfigured: boolean;
  /** Cached offerings for the paywall; null until loaded or when unavailable. */
  offerings: PurchasesOfferings | null;
  /** Refetch offerings (paywall retry). */
  refreshOfferings: () => Promise<void>;
  /** Purchase a package. Resolves true when the user is Pro afterwards. */
  purchase: (pkg: PurchasesPackage) => Promise<boolean>;
  /** Restore purchases. Resolves true when a Pro entitlement was restored. */
  restore: () => Promise<boolean>;
};

const SubscriptionContext = createContext<SubscriptionContextValue | null>(
  null
);

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const { userId } = useAuth();

  const [isConfigured, setIsConfigured] = useState(false);
  const [isPro, setIsPro] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [offerings, setOfferings] = useState<PurchasesOfferings | null>(null);

  useEffect(() => {
    const ok = initRevenueCat();
    setIsConfigured(ok);
    if (!ok) {
      setIsLoading(false);
      return;
    }
    return addCustomerInfoListener((info) => {
      setIsPro(hasProEntitlement(info));
    });
  }, []);

  useEffect(() => {
    if (!isConfigured) return;
    let cancelled = false;

    void (async () => {
      setIsLoading(true);
      try {
        if (userId) {
          const info = await identifyUser(userId);
          if (!cancelled) setIsPro(hasProEntitlement(info));
        } else if (!cancelled) {
          setIsPro(false);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isConfigured, userId]);

  const refreshOfferings = useCallback(async () => {
    const next = await getOfferings();
    setOfferings(next);
  }, []);

  useEffect(() => {
    if (!isConfigured) return;
    void refreshOfferings();
  }, [isConfigured, refreshOfferings]);

  const purchase = useCallback(async (pkg: PurchasesPackage) => {
    const { customerInfo, userCancelled } =
      await purchaseSubscriptionPackage(pkg);
    if (userCancelled) return false;
    const pro = hasProEntitlement(customerInfo);
    setIsPro(pro);
    return pro;
  }, []);

  const restore = useCallback(async () => {
    const info = await restorePurchasesService();
    const pro = hasProEntitlement(info);
    setIsPro(pro);
    return pro;
  }, []);

  const value = useMemo<SubscriptionContextValue>(
    () => ({
      isPro,
      isLoading,
      isConfigured,
      offerings,
      refreshOfferings,
      purchase,
      restore,
    }),
    [isPro, isLoading, isConfigured, offerings, refreshOfferings, purchase, restore]
  );

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription(): SubscriptionContextValue {
  const ctx = useContext(SubscriptionContext);
  if (!ctx) {
    throw new Error("useSubscription must be used within SubscriptionProvider");
  }
  return ctx;
}
