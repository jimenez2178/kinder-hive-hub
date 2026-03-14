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

    // 1. Limpiar sesión previa si existe (evita errores de RLS por sesión cruzada al registrar varios usuarios)
    await supabase.auth.signOut();

    // 2. Sign up the user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: {
                nombre_completo: nombreCompleto,
                full_name: nombreCompleto,
                rol: "padre"
            }
        }
    });

    if (authError) {
        console.error(`[REGISTER] Auth error: ${authError.message}`);
        if (authError.message.includes("rate limit")) {
            return { error: "Límite de registros temporales excedido. Por favor, espere unos minutos o contacte a la Directora para registro manual." };
        }
        return { error: `Error de registro: ${authError.message}` };
    }

    if (!authData.user) {
        return { error: "No se pudo crear el usuario en el sistema de autenticación." };
    }

    console.log(`[REGISTER] Auth user created: ${authData.user.id}. Creating profile...`);

    // 3. Create or update the profile in 'perfiles' table
    // El trigger 'on_auth_user_created' ya se encargó de esto de forma segura.
    // Intentamos un upsert de respaldo, pero si falla por RLS (sesión pendiente de refresco)
    // y el usuario ya existe en Auth, continuamos pues el perfil ya fue creado por el trigger.
    const { error: profileError } = await supabase
        .from("perfiles")
        .upsert({
            id: authData.user.id,
            email: email,
            nombre: nombre,
            nombre_completo: nombreCompleto,
            rol: "padre",
            estado: "pendiente",
            colegio_id: "bd8d5b9b-cb69-4d9e-83cd-84e80b792992" 
        }, { onConflict: 'id' });

    if (profileError && !profileError.message.includes("row-level security")) {
        console.error(`[REGISTER] Profile error: ${profileError.message}`);
        return { error: `Error parcial al configurar perfil: ${profileError.message}. Intente iniciar sesión.` };
    }

    console.log(`[REGISTER] Profile created successfully for ${email}. Redirecting to /espera...`);

    // 3. Redirect to espera
    redirect("/espera");
}
