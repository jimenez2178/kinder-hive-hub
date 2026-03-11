"use server";

import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

export type AuthState = {
    error?: string;
    success?: boolean;
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

    // Fetch the user role from the 'perfiles' table
    const { data: profiles } = await supabase
        .from("perfiles")
        .select("rol")
        .eq("id", data.user.id);

    let profile = profiles?.[0];

    // AUTO-RESCUE: If profile doesn't exist, create it based on email
    if (!profile) {
        console.log(`[LOGIN] Profile missing for ${email}. Creating rescue profile...`);
        const lowerEmail = email.toLowerCase();
        let rescueRol = "padre"; // default
        if (lowerEmail.includes("directora") || lowerEmail.includes("admin") || lowerEmail.includes("kinder")) {
            rescueRol = "directora";
        } else if (lowerEmail.includes("maestro") || lowerEmail.includes("profe")) {
            rescueRol = "maestro";
        }

        const { data: newProfile, error: insertError } = await supabase
            .from("perfiles")
            .insert({
                id: data.user.id,
                nombre: email.split('@')[0],
                nombre_completo: email.split('@')[0], // Fallback
                rol: rescueRol,
                colegio_id: "bd8d5b9b-cb69-4d9e-83cd-84e80b792992" // Sagrada Familia default
            })
            .select()
            .single();

        if (insertError) {
            console.error(`[LOGIN] Failed to create rescue profile: ${insertError.message}`);
        } else {
            profile = newProfile;
            console.log(`[LOGIN] Rescue profile created with rol: ${rescueRol} and Colegio ID`);
        }
    }

    console.log(`[LOGIN] Final Role: "${profile?.rol}"`);

    if (profile?.rol === "directora") {
        console.log(`[LOGIN] Redirecting to /directora`);
        redirect("/directora");
    } else if (profile?.rol === "maestro") {
        console.log(`[LOGIN] Redirecting to /maestro`);
        redirect("/maestro");
    } else {
        console.log(`[LOGIN] Redirecting to /dashboard`);
        redirect("/dashboard");
    }
}

export async function logoutAction() {
    const supabase = await createClient();
    await supabase.auth.signOut();
}
