"use server";

import "server-only";

import { createClient } from "@/utils/supabase/server";
import { getAdminClient } from "@/lib/supabase-admin";
import { enviarNotificacionRegistro } from "@/lib/n8n";


export type RegisterState = {
    error?: string;
    success?: boolean;
    successMessage?: string;
};

export async function registerAction(prevState: RegisterState | null, formData: FormData): Promise<RegisterState> {
    try {
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
        try {
            await supabase.auth.signOut();
        } catch (signOutError) {
            console.warn("[REGISTER] SignOut warning (ignorable):", signOutError);
        }

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
        // VALIDACIÓN DE ENV: Revisa si existe la llave de servicio
        const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

        if (!serviceRoleKey || !supabaseUrl) {
            console.error("[REGISTER] CRITICAL: SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_URL is missing.");
            // Si falta la llave, no intentamos el upsert manual, confiamos en el trigger de BD
        } else {
            try {
                const adminSupabase = getAdminClient();
                const { error: profileError } = await adminSupabase
                    .from("perfiles")
                    .upsert({
                        id: authData.user.id,
                        email: email,
                        nombre_completo: nombreCompleto,
                        nombre_alumno: nombreAlumno,
                        colegio_id: "bd8d5b9b-cb69-4d9e-83cd-84e80b792992",
                        rol: "padre",
                        estado_aprobacion: "pendiente"
                    }, { onConflict: 'id' });

                if (profileError) {
                    console.error(`[REGISTER] Profile upsert error: ${profileError.message}`);
                }
            } catch (adminError) {
                console.error("[REGISTER] Error initializing admin client:", adminError);
            }
        }

        console.log(`[REGISTER] Registration successful for ${email}.`);

        return { 
            success: true, 
            successMessage: "¡Registro Exitoso! Espera la aprobación de la dirección." 
        };
    } catch (fatalError: any) {
        console.error("[REGISTER_FATAL] Unexpected error in registerAction:", fatalError);
        return { 
            error: "Error interno del servidor. Por favor, contacte a soporte si el problema persiste." 
        };
    }
}
