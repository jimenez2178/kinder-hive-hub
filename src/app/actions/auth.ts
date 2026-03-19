"use server";

import "server-only";

import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

export type AuthState = {
    error?: string;
    success?: boolean;
    redirect?: string;
};

export async function loginAction(prevState: AuthState | null, formData: FormData): Promise<AuthState> {
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    
    console.log(`[AUTH_DEBUG] loginAction started for: ${email}`);
    
    let supabase;
    try {
        supabase = await createClient();
    } catch (e) {
        console.error("[AUTH_DEBUG] createClient failed:", e);
        return { error: "Error de servidor interno." };
    }
    
    console.log("[AUTH_DEBUG] Attempting signInWithPassword...");
    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
    });

    if (error) {
        console.error(`[AUTH_DEBUG] signIn Error: ${error.message}`);
        return { error: "Credenciales inválidas o error de conexión." };
    }

    console.log(`[AUTH_DEBUG] User ${email} authenticated successfully.`);

    // Fetch the user role and status from the 'perfiles' table
    // Usamos select('*') para asegurar que traemos toda la data necesaria para el login
    const { data: profile, error: profileError } = await supabase
        .from("perfiles")
        .select("*")
        .eq("id", data.user.id)
        .single();

    if (profileError || !profile) {
        console.error(`[AUTH_DEBUG] Profile not found for ${data.user.id}: ${profileError?.message}`);
        // RESCUE: Si no hay perfil, lo creamos ahora mismo
        const lowerEmail = email.toLowerCase();
        let rescueRol = "padre";
        if (lowerEmail.includes("directora") || lowerEmail.includes("admin") || lowerEmail.includes("kinder")) rescueRol = "directora";
        else if (lowerEmail.includes("maestro") || lowerEmail.includes("profe")) rescueRol = "maestro";

        const { data: newProfile, error: rescueError } = await supabase
            .from("perfiles")
            .upsert({
                id: data.user.id,
                email: lowerEmail,
                nombre: lowerEmail.split('@')[0],
                nombre_completo: lowerEmail.split('@')[0],
                rol: rescueRol,
                estado_aprobacion: rescueRol === "padre" ? "pendiente" : "aprobado",
                colegio_id: "bd8d5b9b-cb69-4d9e-83cd-84e80b792992"
            })
            .select()
            .single();
        
        if (rescueError) return { error: "Error al sincronizar perfil. Por favor, contacte soporte." };
        
        // Redirigir basado en el nuevo perfil rescatado
        if (newProfile.estado_aprobacion === "pendiente") return { redirect: "/espera" };
        if (newProfile.rol === "directora") return { redirect: "/dashboard/directora" };
        return { redirect: "/dashboard/padre" };
    }

    console.log(`[LOGIN] User found: ${profile.email}, Role: ${profile.rol}, Status: ${profile.estado_aprobacion}`);

    if (profile.estado_aprobacion === "pendiente") {
        return { redirect: "/espera" };
    }

    if (profile.rol === "directora") {
        return { redirect: "/dashboard/directora" };
    } else if (profile.rol === "maestro") {
        return { redirect: "/maestro" };
    } else {
        return { redirect: "/dashboard/padre" };
    }
}

export async function logoutAction() {
    const supabase = await createClient();
    await supabase.auth.signOut();
}
