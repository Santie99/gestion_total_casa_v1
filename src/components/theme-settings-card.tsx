"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getAppThemeMode, setAppThemeMode, type ThemeMode } from "@/components/theme-runtime";

const options: { value: ThemeMode; title: string; description: string }[] = [
  { value: "light", title: "Claro", description: "Interfaz clara todo el tiempo." },
  { value: "dark", title: "Oscuro", description: "Interfaz oscura todo el tiempo." },
  { value: "auto", title: "Automático", description: "Claro de 7:00 a.m. a 7:00 p.m.; oscuro en la noche." },
];

export function ThemeSettingsCard() {
  const [mode, setMode] = useState<ThemeMode>("light");

  useEffect(() => {
    setMode(getAppThemeMode());
  }, []);

  const helperText = useMemo(() => {
    if (mode === "auto") return "Activo: alternancia automática por hora local del dispositivo.";
    return mode === "dark" ? "Activo: modo oscuro fijo." : "Activo: modo claro fijo.";
  }, [mode]);

  function handleSelect(nextMode: ThemeMode) {
    setMode(nextMode);
    setAppThemeMode(nextMode);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Apariencia</CardTitle>
        <CardDescription>Controla el modo claro u oscuro de la PWA y la vista desktop.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-3">
          {options.map((option) => {
            const active = mode === option.value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => handleSelect(option.value)}
                className={`rounded-2xl border p-4 text-left transition active:scale-[0.99] ${
                  active ? "border-slate-950 bg-slate-950 text-white" : "bg-white text-slate-800 hover:bg-slate-50"
                }`}
              >
                <span className="block text-sm font-semibold">{option.title}</span>
                <span className={`mt-1 block text-xs ${active ? "text-slate-300" : "text-muted-foreground"}`}>{option.description}</span>
              </button>
            );
          })}
        </div>
        <p className="rounded-2xl bg-slate-50 p-3 text-sm text-muted-foreground">{helperText}</p>
      </CardContent>
    </Card>
  );
}
