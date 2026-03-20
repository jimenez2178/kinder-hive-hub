"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export async function updateNotificationSettingsAction(data: { seguridad?: boolean, pagos?: boolean, avisos?: boolean }) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { error: "No autorizado" };

    const { error } = await supabase
        .from("settings_notificaciones")
        .upsert({ 
            user_id: user.id, 
            ...data,
            updated_at: new Date().toISOString()
        }, { onConflict: "user_id" });

    if (error) return { error: error.message };

    revalidatePath("/notificaciones");
    return { success: true };
}

export async function getNotificationSettingsAction() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { error: "No autorizado" };

    const { data, error } = await supabase
        .from("settings_notificaciones")
        .select("*")
        .eq("user_id", user.id)
        .single();

    if (error && error.code !== "PGRST116") {
        console.error("Error fetching notification settings:", error);
        return { error: error.message };
    }

    return { 
        data: data || { 
            seguridad: true, 
            pagos: true, 
            avisos: true 
        } 
    };
}
