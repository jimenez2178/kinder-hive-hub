"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export async function addNotaAction(prevState: unknown, formData: FormData) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { error: "No autorizado" };

    const estudiante_id = formData.get("estudiante_id") as string;
    const categoria = formData.get("categoria") as string;
    const observaciones = formData.get("observaciones") as string;

    // Obtener nombre del maestro/maestra
    const { data: profile } = await supabase
        .from("perfiles")
        .select("nombre_completo")
        .eq("id", user.id)
        .single();

    const maestro_nombre = profile?.nombre_completo || "Maestro(a)";

    const { error } = await supabase.from("evaluaciones").insert({
        estudiante_id,
        maestro_id: user.id,
        maestro_nombre,
        categoria,
        observaciones,
        fecha: new Date().toISOString().split('T')[0]
    });

    if (error) return { error: error.message };

    revalidatePath("/maestro");
    revalidatePath("/dashboard");
    return { success: true, timestamp: Date.now() };
}

export async function deleteNotaAction(prevState: unknown, formData: FormData) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { error: "No autorizado" };

    const id = formData.get("id") as string;

    const { error } = await supabase
        .from("evaluaciones")
        .delete()
        .eq("id", id)
        .eq("maestro_id", user.id); // Security check to ensure they can only delete their own

    if (error) return { error: error.message };

    revalidatePath("/maestro");
    revalidatePath("/dashboard");
    return { success: true, timestamp: Date.now() };
}
