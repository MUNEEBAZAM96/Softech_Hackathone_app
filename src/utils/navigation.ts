import { router, type Href } from "expo-router";

/**
 * Avoids GO_BACK warnings when a screen is opened directly (no history stack).
 */
export function safeBack(fallback: Href = "/"): void {
  if (router.canGoBack()) {
    router.back();
    return;
  }
  router.replace(fallback);
}
