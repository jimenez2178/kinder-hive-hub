"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export async function processParentPaymentAction(monto: number) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { error: "No autorizado" };

    // Find children linked to this parent (Manuel in this case)
    const { data: estudiantes } = await supabase
        .from("estudiantes")
        .select("id")
        .eq("padre_id", user.id);

    if (!estudiantes || estudiantes.length === 0) {
        return { error: "No se encontraron estudiantes asociados" };
    }

    // Insert payment for the first student found (Simplified for demo)
    const { error } = await supabase.from("pagos").insert({
        estudiante_id: estudiantes[0].id,
        monto: monto,
        metodo: "TRANSFERENCIA",
        estado: "saldado",
        fecha: new Date().toISOString().split('T')[0]
    });

    if (error) return { error: error.message };

    revalidatePath("/");
    return { success: true };
}

export async function uploadComprobanteAction(pagoId: string, url: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { error: "No autorizado" };

    const { error } = await supabase
        .from("pagos")
        .update({ url_comprobante: url, estado: 'en_revision' })
        .eq('id', pagoId);

    if (error) return { error: error.message };

    revalidatePath("/");
    return { success: true };
}
export async function reportarPagoAction(data: { estudiante_id: string, monto: number, concepto: string, url_comprobante?: string }) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { error: "No autorizado" };

    const { error } = await supabase.from("pagos").insert({
        estudiante_id: data.estudiante_id,
        monto: data.monto,
        metodo: "TRANSFERENCIA",
        estado: data.url_comprobante ? 'en_revision' : 'pendiente',
        url_comprobante: data.url_comprobante || null,
        fecha: new Date().toISOString().split('T')[0]
    });

    if (error) return { error: error.message };

    revalidatePath("/dashboard/padre");
    return { success: true };
}
