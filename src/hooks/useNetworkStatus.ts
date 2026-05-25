import { useEffect, useState } from "react";

export function useNetworkStatus() {
  const [online, setOnline] = useState(() => (typeof navigator === "undefined" ? true : navigator.onLine));

  useEffect(() => {
    const setOnlineStatus = () => setOnline(true);
    const setOfflineStatus = () => setOnline(false);
    window.addEventListener("online", setOnlineStatus);
    window.addEventListener("offline", setOfflineStatus);
    return () => {
      window.removeEventListener("online", setOnlineStatus);
      window.removeEventListener("offline", setOfflineStatus);
    };
  }, []);

  return online;
}
