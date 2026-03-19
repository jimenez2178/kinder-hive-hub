"use server";

import { createClient } from "@/utils/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { enviarNotificacionRegistro } from "@/lib/n8n";


export type RegisterState = {
    error?: string;
    success?: boolean;
    successMessage?: string;
};

export async function registerAction(prevState: RegisterState | null, formData: FormData): Promise<RegisterState> {
    // Limpiamos los espacios en el email para evitar errores del SDK
    const emailRaw = (formData.get("email") as string) || "";
    const email = emailRaw.replace(/\s+/g, "").toLowerCase();
    
    const password = formData.get("password") as string;
    const nombreCompleto = (formData.get("nombre_completo") as string)?.trim();
    const nombreAlumno = (formData.get("nombre_alumno") as string)?.trim();
    
    const nombre = email.split('@')[0];
    
    console.log(`[REGISTER] Register attempt for: ${email}`);
    
    // 1. Forzar cierre de sesión de cualquier usuario activo (ej: la directora)
    // para que Supabase no lance error de sesión cruzada
    const supabase = await createClient();
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
        // Si el correo ya existe, dar un mensaje claro
        if (authError.message.toLowerCase().includes("already registered") || authError.message.toLowerCase().includes("user already")) {
            return { error: "Este correo electrónico ya está registrado. Intenta iniciar sesión." };
        }
        return { error: `Error de registro: ${authError.message}` };
    }

    if (!authData.user) {
        // Puede ocurrir si el correo ya existe y la confirmación de email está activa.
        // Supabase a veces devuelve user=null sin error cuando el email ya existe.
        return { error: "Este correo ya puede estar registrado. Intenta iniciar sesión o usa otro correo." };
    }

    console.log(`[REGISTER] Auth user created: ${authData.user.id}. Creating profile...`);

    // 3. Trigger Notification to Director (non-blocking, no await effect on result)
    enviarNotificacionRegistro(email, nombreCompleto).catch(e => console.error("[REGISTER] Notification error:", e));

    // 4. Create or update the profile in 'perfiles' table
    // Usamos el service role para que las políticas RLS no bloqueen la creación del perfil
    // cuando el usuario acaba de ser creado y aún no hay sesión activa.
    const adminSupabase = createAdminClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { error: profileError } = await adminSupabase
        .from("perfiles")
        .upsert({
            id: authData.user.id,
            email: email,
            nombre: nombre,
            nombre_completo: nombreCompleto,
            rol: "padre",
            estado: "pendiente",
            estado_aprobacion: "pendiente",
            nombre_alumno: nombreAlumno,
            colegio_id: "bd8d5b9b-cb69-4d9e-83cd-84e80b792992" 
        }, { onConflict: 'id' });

    if (profileError) {
        console.error(`[REGISTER] Profile error: ${profileError.message}`);
        // No fallamos el flujo — el trigger de Supabase aún puede haber creado el perfil
    }

    console.log(`[REGISTER] Registration successful for ${email}.`);

    return { 
        success: true, 
        successMessage: "¡Registro Exitoso! Espera la aprobación de la dirección." 
    };
}
