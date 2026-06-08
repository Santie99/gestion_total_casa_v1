"use client";

import { useEffect, useState } from "react";
import { WifiOff } from "lucide-react";

export function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    const updateStatus = () => setIsOffline(!navigator.onLine);
    updateStatus();
    window.addEventListener("online", updateStatus);
    window.addEventListener("offline", updateStatus);
    return () => {
      window.removeEventListener("online", updateStatus);
      window.removeEventListener("offline", updateStatus);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <div className="fixed left-3 right-3 top-3 z-50 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 shadow-lg lg:left-80 lg:right-6">
      <div className="flex items-center gap-2">
        <WifiOff className="h-4 w-4" />
        <span>Estás sin conexión. Puedes navegar pantallas cacheadas, pero guardar datos requiere internet.</span>
      </div>
    </div>
  );
}
