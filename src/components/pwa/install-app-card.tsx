"use client";

import { useEffect, useState } from "react";
import { Download, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

function isStandaloneDisplay() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(display-mode: standalone)").matches || (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
}

export function InstallAppCard() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    setIsInstalled(isStandaloneDisplay());
    setIsIOS(/iphone|ipad|ipod/i.test(window.navigator.userAgent));

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setInstallPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  async function handleInstall() {
    if (!installPrompt) return;
    await installPrompt.prompt();
    await installPrompt.userChoice;
    setInstallPrompt(null);
    setIsInstalled(isStandaloneDisplay());
  }

  if (isInstalled) {
    return null;
  }

  return (
    <div className="rounded-3xl border bg-white p-4 shadow-sm sm:p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="rounded-2xl bg-slate-100 p-2 text-slate-800"><Smartphone className="h-5 w-5" /></span>
          <div>
            <p className="text-sm font-semibold text-slate-950">Instalar como app</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Acceso rápido desde el celular, pantalla completa y navegación tipo PWA.
            </p>
            {isIOS ? (
              <p className="mt-2 text-xs text-muted-foreground">
                En iPhone: Safari → Compartir → Agregar a pantalla de inicio.
              </p>
            ) : null}
          </div>
        </div>
        {installPrompt ? (
          <Button onClick={handleInstall} className="w-full gap-2 sm:w-auto">
            <Download className="h-4 w-4" /> Instalar
          </Button>
        ) : (
          <p className="rounded-2xl bg-slate-50 px-3 py-2 text-xs text-muted-foreground sm:max-w-52">
            Si el botón no aparece, usa el menú del navegador y elige instalar/agregar a inicio.
          </p>
        )}
      </div>
    </div>
  );
}
