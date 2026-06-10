import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();

  if (!userData.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);

  return NextResponse.json({
    status: "prepared",
    message: "Endpoint interno preparado para una futura capa IA. Sprint 16 no llama proveedores externos ni genera texto con IA.",
    receivedAt: new Date().toISOString(),
    expectedPayload: {
      context: "Resumen financiero/operativo del hogar",
      deterministicInsights: "Insights generados por reglas internas",
      tone: "Claro, accionable, no alarmista",
    },
    payloadPreview: body ?? null,
  });
}
