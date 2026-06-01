export function getFriendlyErrorMessage(error: unknown, fallback = "No se pudo completar la acción. Revisa los datos e intenta de nuevo.") {
  if (!error) return fallback;

  const message = typeof error === "object" && error !== null && "message" in error
    ? String((error as { message?: unknown }).message ?? "")
    : String(error);

  if (!message) return fallback;

  const lower = message.toLowerCase();

  if (lower.includes("failed to fetch")) {
    return "No se pudo conectar con Supabase. Revisa conexión, sesión activa y variables de entorno.";
  }

  if (lower.includes("permission") || lower.includes("row-level security") || lower.includes("rls")) {
    return "No tienes permisos para guardar este dato. Revisa que la migración del sprint esté ejecutada en Supabase.";
  }

  if (lower.includes("duplicate") || lower.includes("unique")) {
    return "Ya existe un registro con esos datos. Revisa si está duplicado.";
  }

  if (lower.includes("check constraint")) {
    return "Uno de los datos no cumple las reglas del sistema. Revisa fechas, cantidades y valores.";
  }

  if (lower.includes("violates foreign key")) {
    return "El registro seleccionado ya no existe o no pertenece a esta familia. Actualiza la página e intenta de nuevo.";
  }

  return message;
}
