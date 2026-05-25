import { registerSW } from "virtual:pwa-register";

export function registerArkaneServiceWorker() {
  if (!("serviceWorker" in navigator)) {
    return;
  }

  registerSW({
    immediate: true,
    onNeedRefresh() {
      window.dispatchEvent(new CustomEvent("arkane:update-available"));
    },
    onOfflineReady() {
      window.dispatchEvent(new CustomEvent("arkane:offline-ready"));
    },
    onRegisteredSW(_swUrl, registration) {
      registration?.update().catch(() => undefined);
    }
  });
}
