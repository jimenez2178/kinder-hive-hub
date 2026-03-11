"use server";

import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

export type RegisterState = {
    error?: string;
    success?: boolean;
};

export async function registerAction(prevState: RegisterState | null, formData: FormData): Promise<RegisterState> {
    const email = (formData.get("email") as string)?.trim().toLowerCase();
    const password = formData.get("password") as string;
    const nombre = (formData.get("nombre") as string)?.trim();
    const nombreCompleto = (formData.get("nombre_completo") as string)?.trim();
    
    console.log(`[REGISTER] Register attempt for: ${email}`);
    
    const supabase = await createClient();

    // 1. Sign up the user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: {
                full_name: nombreCompleto,
            }
        }
    });

    if (authError) {
        console.error(`[REGISTER] Auth error: ${authError.message}`);
        return { error: `Error de registro: ${authError.message}` };
    }

    if (!authData.user) {
        return { error: "No se pudo crear el usuario en el sistema de autenticación." };
    }

    console.log(`[REGISTER] Auth user created: ${authData.user.id}. Creating profile...`);

    // 2. Create the profile in 'perfiles' table
    const { error: profileError } = await supabase
        .from("perfiles")
        .insert({
            id: authData.user.id,
            nombre: nombre,
            nombre_completo: nombreCompleto,
            rol: "padre",
            colegio_id: "bd8d5b9b-cb69-4d9e-83cd-84e80b792992" 
        });

    if (profileError) {
        console.error(`[REGISTER] Profile error: ${profileError.message}`);
        return { error: `Cuenta creada pero hubo un error de perfil: ${profileError.message}. Intente iniciar sesión.` };
    }

    console.log(`[REGISTER] Profile created successfully for ${email}. Redirecting...`);

    // 3. Redirect to dashboard
    redirect("/dashboard");
}
