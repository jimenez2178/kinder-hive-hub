"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

async function getColegioId(supabase: any) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    const { data: perfil } = await supabase
        .from("perfiles")
        .select("colegio_id")
        .eq("id", user.id)
        .single();
    return perfil?.colegio_id;
}

export async function addPaymentAction(prevState: unknown, formData: FormData) {
    const supabase = await createClient();
    const estudiante_id = formData.get("estudiante_id") as string;
    const montoPorMes = parseFloat(formData.get("monto") as string);
    const metodo = formData.get("metodo") as string;
    const estado = formData.get("estado") as string;
    const fecha = formData.get("fecha") as string || new Date().toISOString().split('T')[0];
    const cantidadMeses = parseInt(formData.get("cantidad_meses") as string) || 1;
    const comprobanteFile = formData.get("comprobante") as File;

    // Total = monto mensual × cantidad de meses
    const montoTotal = montoPorMes * cantidadMeses;

    let comprobante_url = null;

    if (comprobanteFile && comprobanteFile.size > 0) {
        const fileExt = comprobanteFile.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `payments/${fileName}`;

        const { error: uploadError } = await supabase.storage
            .from('kinder-assets')
            .upload(filePath, comprobanteFile);

        if (!uploadError) {
            const { data: { publicUrl } } = supabase.storage
                .from('kinder-assets')
                .getPublicUrl(filePath);
            comprobante_url = publicUrl;
        }
    }

    // Construir los meses a pagar como nota en el concepto
    const mesNombres = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
    const fechaBase = new Date(fecha + 'T12:00:00');
    const mesesCubiertos: string[] = [];
    for (let i = 0; i < cantidadMeses; i++) {
        const d = new Date(fechaBase);
        d.setMonth(d.getMonth() + i);
        mesesCubiertos.push(`${mesNombres[d.getMonth()]} ${d.getFullYear()}`);
    }
    const concepto = cantidadMeses > 1
        ? `Pago correspondiente a ${cantidadMeses} meses: ${mesesCubiertos.join(', ')}`
        : `Pago mensualidad — ${mesesCubiertos[0]}`;

    // Insertar un único registro con el total y el concepto
    const { error } = await supabase.from("pagos").insert({
        estudiante_id,
        monto: montoTotal,
        metodo,
        estado,
        fecha,
        comprobante_url,
        concepto,
        colegio_id: await getColegioId(supabase)
    });

    if (error) return { error: error.message };

    revalidatePath("/directora");
    revalidatePath("/dashboard");
    return { success: true, timestamp: Date.now(), concepto, montoTotal };
}

export async function addEventAction(prevState: unknown, formData: FormData) {
    const supabase = await createClient();
    const titulo = formData.get("titulo") as string;
    const descripcion = formData.get("descripcion") as string;
    const fecha = formData.get("fecha") as string;
    const locacion = formData.get("locacion") as string;

    const { error } = await supabase.from("eventos").insert({
        titulo,
        descripcion,
        fecha,
        locacion,
        colegio_id: await getColegioId(supabase)
    });

    if (error) return { error: error.message };

    revalidatePath("/directora");
    revalidatePath("/dashboard");
    return { success: true, timestamp: Date.now() };
}

export async function addPhotoAction(prevState: unknown, formData: FormData) {
    const supabase = await createClient();
    const titulo = formData.get("titulo") as string;
    const descripcion = formData.get("descripcion") as string;
    const photoFile = formData.get("foto") as File;

    let foto_url = "";

    if (photoFile && photoFile.size > 0) {
        const fileExt = photoFile.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `gallery/${fileName}`;

        const { error: uploadError } = await supabase.storage
            .from('kinder-assets')
            .upload(filePath, photoFile);

        if (uploadError) return { error: "Upload failed: " + uploadError.message };

        const { data: { publicUrl } } = supabase.storage
            .from('kinder-assets')
            .getPublicUrl(filePath);
        foto_url = publicUrl;
    }

    const { error } = await supabase.from("galeria").insert({
        titulo,
        descripcion,
        foto_url,
        colegio_id: await getColegioId(supabase)
    });

    if (error) return { error: error.message };

    revalidatePath("/directora");
    revalidatePath("/dashboard");
    return { success: true, timestamp: Date.now() };
}

export async function addEstudianteAction(prevState: unknown, formData: FormData) {
    const supabase = await createClient();

    // 1. Obtener el Colegio ID de la Directora (usando tu nueva función dinámica)
    const colegioId = await getColegioId(supabase);

    // 2. Obtener los datos del formulario (Priorizando los nombres de campo de la solicitud)
    const nombreEstudiante = formData.get('nombre') as string;
    const grado = formData.get('grado') as string;
    const fechaNacimiento = formData.get('fecha_nacimiento') as string;
    // El formulario actual usa 'nombre_tutor', pero permitimos 'tutor_nombre'
    const tutorNombreRaw = (formData.get('tutor_nombre') || formData.get('nombre_tutor')) as string;
    const tutorNombre = tutorNombreRaw?.trim() || "";
    const tutorEmail = (formData.get('tutor_email') as string)?.trim().toLowerCase() || "";
    const cuotaMensual = parseFloat(formData.get('cuota_mensual') as string) || 11000;

    // 3. LA MAGIA: Buscar al padre
    const explicitPadreId = formData.get('padre_id') as string;
    let finalPadreId = null;

    if (explicitPadreId && explicitPadreId !== "") {
        finalPadreId = explicitPadreId;
    } else if (tutorEmail) {
        // Mejorado: Buscar en perfiles por nombre (prefix) o por email si agregamos esa búsqueda
        // Como no tenemos columna email en perfiles, buscamos por 'nombre' (que el rescue login llena con el email prefix)
        const emailPrefix = tutorEmail.split('@')[0];
        
        const { data: perfilPadre } = await supabase
            .from('perfiles')
            .select('id')
            .or(`nombre.eq.${emailPrefix},nombre_completo.ilike.%${tutorNombre}%`)
            .eq('rol', 'padre')
            .limit(1)
            .maybeSingle();
            
        finalPadreId = perfilPadre?.id || null;
    }

    // 4. Insertar al estudiante con el vínculo automático
    // Guardamos el email dentro del campo tutor_nombre para búsqueda cruzada si no hay ID
    // Esto es CRUCIAL para que el dashboard del padre encuentre al niño por email
    const displayTutor = tutorNombre || tutorEmail.split('@')[0] || "Tutor";
    const savedTutorInfo = tutorEmail ? `${displayTutor} [${tutorEmail}]` : displayTutor;

    const { error } = await supabase
        .from('estudiantes')
        .insert([
            {
                nombre: nombreEstudiante,
                grado: grado,
                fecha_nacimiento: fechaNacimiento,
                cuota_mensual: cuotaMensual,
                colegio_id: colegioId,
                padre_id: finalPadreId,
                tutor_nombre: savedTutorInfo,
                estatus: 'Activo'
            }
        ]);

    if (error) return { error: error.message };

    revalidatePath("/directora");
    revalidatePath("/dashboard");
    return { success: true, timestamp: Date.now() };
}

export async function addComunicadoAction(prevState: unknown, formData: FormData) {
    const supabase = await createClient();
    const titulo = formData.get("titulo") as string;
    const contenido = formData.get("contenido") as string;
    const prioridad = formData.get("prioridad") as string; // 'alta', 'media', 'baja'
    const sendPush = formData.get("send_push") === "on";

    const { error } = await supabase.from("comunicados").insert({
        titulo,
        contenido,
        prioridad,
        colegio_id: await getColegioId(supabase)
    });

    if (error) return { error: error.message };

    if (sendPush || prioridad === 'alta') {
        console.log(`[PUSH TRIGGERED] Title: ${titulo}, Priority: ${prioridad}`);
    }

    revalidatePath("/directora");
    revalidatePath("/dashboard");
    return { success: true, timestamp: Date.now() };
}

export async function addAgradecimientoAction(prevState: unknown, formData: FormData) {
    const supabase = await createClient();
    const titulo = formData.get("titulo") as string;
    const contenido = formData.get("contenido") as string;

    const { error } = await supabase.from("agradecimientos").insert({
        titulo,
        contenido,
        colegio_id: await getColegioId(supabase)
    });

    if (error) return { error: error.message };

    revalidatePath("/directora");
    revalidatePath("/dashboard");
    return { success: true, timestamp: Date.now() };
}

export async function deleteEstudianteAction(id: string) {
    const supabase = await createClient();
    const { error } = await supabase.from("estudiantes").delete().eq("id", id);

    if (error) return { error: error.message };

    revalidatePath("/directora");
    revalidatePath("/dashboard");
    return { success: true };
}

export async function deleteAllEstudiantesAction() {
    const supabase = await createClient();
    const { error } = await supabase.from("estudiantes").delete().neq("id", "00000000-0000-0000-0000-000000000000");

    if (error) return { error: error.message };

    revalidatePath("/directora");
    revalidatePath("/dashboard");
    return { success: true };
}
