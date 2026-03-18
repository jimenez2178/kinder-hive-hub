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

    const { data: profile } = await supabase
        .from("perfiles")
        .select("nombre_completo, colegio_id")
        .eq("id", user.id)
        .single();

    const notas: Record<string, string> = {};
    const categoriasBase = ["Salud", "Matemáticas", "Ciencias", "Lectura", "Conducta", "Motricidad"];
    categoriasBase.forEach(cat => {
        const val = formData.get(`nota_${cat}`) as string;
        if (val) notas[cat] = val;
    });

    const { error } = await supabase.from("evaluaciones").insert({
        estudiante_id,
        maestro_id: user.id,
        colegio_id: profile?.colegio_id,
        categoria,
        observaciones,
        notas,
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

export async function addCalificacionAction(prevState: unknown, formData: FormData) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { error: "No autorizado" };

    const estudiante_id = formData.get("estudiante_id") as string;
    const asignatura = formData.get("asignatura") as string;
    const nota_mes = formData.get("nota_mes") ? parseFloat(formData.get("nota_mes") as string) : null;
    const nota_prueba = formData.get("nota_prueba") ? parseFloat(formData.get("nota_prueba") as string) : null;
    const nota_final = formData.get("nota_final") ? parseFloat(formData.get("nota_final") as string) : null;
    const comentario_especifico = formData.get("comentario_especifico") as string;
    const periodo = formData.get("periodo") as string;

    const { data: profile } = await supabase
        .from("perfiles")
        .select("colegio_id")
        .eq("id", user.id)
        .single();

    const { error } = await supabase.from("calificaciones").insert({
        estudiante_id,
        maestro_id: user.id,
        colegio_id: profile?.colegio_id,
        asignatura,
        nota_mes,
        nota_prueba,
        nota_final,
        comentario_especifico,
        periodo
    });

    if (error) return { error: error.message };

    revalidatePath("/maestro");
    revalidatePath("/dashboard");
    return { success: true, timestamp: Date.now() };
}

export async function deleteCalificacionAction(prevState: unknown, formData: FormData) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { error: "No autorizado" };

    const id = formData.get("id") as string;

    const { error } = await supabase
        .from("calificaciones")
        .delete()
        .eq("id", id)
        .eq("maestro_id", user.id); 

    if (error) return { error: error.message };

    revalidatePath("/maestro");
    return { success: true };
}
