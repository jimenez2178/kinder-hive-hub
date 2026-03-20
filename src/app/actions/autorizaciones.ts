"use server";

import "server-only";
import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

async function getColegioId(supabase: any) {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data?.user) return null;
    
    const { data: perfil } = await supabase
        .from("perfiles")
        .select("colegio_id")
        .eq("id", data.user.id)
        .single();
    return perfil?.colegio_id;
}

export async function addAuthorizedAction(formData: FormData) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "No autenticado" };

    const alumno_id = formData.get("alumno_id") as string;
    const nombre_sustituto = formData.get("nombre_sustituto") as string;
    const cedula = formData.get("cedula") as string;
    const parentesco = formData.get("parentesco") as string;
    const photoFile = formData.get("foto") as File;

    if (!alumno_id || !nombre_sustituto || !cedula || !parentesco) {
        return { error: "Todos los campos son obligatorios" };
    }

    let foto_url = null;

    if (photoFile && photoFile.size > 0) {
        // Path: autorizaciones/[padre_id]/[timestamp]_[name]
        const fileExt = photoFile.name.split('.').pop() || 'jpg';
        const fileName = `${Date.now()}.${fileExt}`;
        const filePath = `${user.id}/${fileName}`;

        const { error: uploadError } = await supabase.storage
            .from('autorizaciones')
            .upload(filePath, photoFile);

        if (uploadError) return { error: "Error al subir foto: " + uploadError.message };

        const { data: { publicUrl } } = supabase.storage
            .from('autorizaciones')
            .getPublicUrl(filePath);
        foto_url = publicUrl;
    }

    const colegio_id = await getColegioId(supabase);

    const { error } = await supabase.from("autorizados_recogida").insert({
        padre_id: user.id,
        alumno_id,
        nombre_sustituto,
        cedula,
        parentesco,
        foto_url,
        colegio_id,
        estado: 'activo'
    });

    if (error) return { error: error.message };

    revalidatePath("/dashboard/padre");
    revalidatePath("/dashboard/directora");
    return { success: true };
}

export async function deleteAuthorizedAction(id: string, fotoPath?: string) {
    const supabase = await createClient();
    
    // Eliminar registro
    const { error } = await supabase
        .from("autorizados_recogida")
        .delete()
        .eq("id", id);

    if (error) return { error: error.message };

    // Si hay foto, intentar borrarla del storage
    if (fotoPath) {
        // El path suele estar en la URL pública, necesitamos extraerlo.
        // O mejor, pasamos el path relativo si lo tenemos.
        // Asumiendo que fotoPath es el path relativo (user.id/filename)
        await supabase.storage.from('autorizaciones').remove([fotoPath]);
    }

    revalidatePath("/dashboard/padre");
    revalidatePath("/dashboard/directora");
    return { success: true };
}

export async function getAuthorizedByStudentAction(alumnoId: string) {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from("autorizados_recogida")
        .select("*")
        .eq("alumno_id", alumnoId)
        .eq("estado", "activo");

    if (error) return { error: error.message };
    return { data };
}
