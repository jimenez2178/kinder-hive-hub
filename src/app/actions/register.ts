"use server";

import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

export type RegisterState = {
    error?: string;
    success?: boolean;
};

export async function registerAction(prevState: RegisterState | null, formData: FormData): Promise<RegisterState> {
    // Limpiamos los espacios en el email (incluso los internos) para evitar errores del SDK
    const emailRaw = (formData.get("email") as string) || "";
    const email = emailRaw.replace(/\s+/g, "").toLowerCase();
    
    const password = formData.get("password") as string;
    const nombreCompleto = (formData.get("nombre_completo") as string)?.trim();
    
    // Usamos el prefijo del correo electrónico como "nombre" obligatoriamente para que luego
    // la función "addEstudianteAction" (que vincula al padre a través del email) lo pueda encontrar.
    const nombre = email.split('@')[0];
    
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
            estado: "pendiente",
            colegio_id: "bd8d5b9b-cb69-4d9e-83cd-84e80b792992" 
        });

    if (profileError) {
        console.error(`[REGISTER] Profile error: ${profileError.message}`);
        return { error: `Cuenta creada pero hubo un error de perfil: ${profileError.message}. Intente iniciar sesión.` };
    }

    console.log(`[REGISTER] Profile created successfully for ${email}. Redirecting to /espera...`);

    // 3. Redirect to espera
    redirect("/espera");
}
