"use server";

import "server-only";

import { createClient } from "@/utils/supabase/server";
import { getAdminClient } from "@/lib/supabase-admin";
import { revalidatePath } from "next/cache";
import { enviarNotificacionPago } from "@/lib/n8n";

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

export async function addPaymentAction(prevState: unknown, formData: FormData) {
    const supabase = await createClient();
    const estudiante_id = formData.get("estudiante_id") as string;
    if (!estudiante_id) return { error: "Debe seleccionar un alumno válido de la lista." };
    
    const montoPorMes = parseFloat(formData.get("monto") as string);
    const metodo_pago = formData.get("metodo_pago") as string;
    const estado = (formData.get("estado") as string) || "saldado";
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
        metodo: metodo_pago,
        estado,
        fecha,
        url_comprobante: comprobante_url,
        concepto,
        colegio_id: await getColegioId(supabase)
    });

    if (error) return { error: error.message };

    revalidatePath("/dashboard/directora");
    revalidatePath("/dashboard/padre");
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

    revalidatePath("/dashboard/directora");
    revalidatePath("/dashboard/padre");
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

    revalidatePath("/dashboard/directora");
    revalidatePath("/dashboard/padre");
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
        // Mejorado: Buscar en perfiles por EMAIL directamente
        const { data: perfilPadre } = await supabase
            .from('perfiles')
            .select('id')
            .eq('email', tutorEmail)
            .eq('rol', 'padre')
            .limit(1)
            .maybeSingle();
            
        finalPadreId = perfilPadre?.id || null;
    }

    // 4. Insertar al estudiante con el vínculo automático
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
                email_tutor: tutorEmail,
                estatus: 'Saldado' // Por defecto para que aparezca "Al Día" si no hay deudas
            }
        ]);

    if (error) return { error: error.message };

    // 5. Si encontramos y vinculamos a un padre, lo aprobamos automáticamente para desbloquearlo
    if (finalPadreId) {
        const { error: updateError } = await supabase
            .from('perfiles')
            .update({ estado_aprobacion: 'aprobado' })
            .eq('id', finalPadreId);
        
        if (updateError) {
            console.error("[addEstudianteAction] Error auto-aproving parent:", updateError);
        } else {
            console.log(`[addEstudianteAction] Parent ${finalPadreId} auto-approved.`);
        }
    }

    revalidatePath("/dashboard/directora");
    revalidatePath("/dashboard/padre");
    return { success: true, timestamp: Date.now() };
}

export async function addComunicadoAction(prevState: unknown, formData: FormData) {
    const supabase = await createClient();
    const titulo = formData.get("titulo") as string;
    const contenido = formData.get("contenido") as string;
    const prioridad = formData.get("prioridad") as string; // 'alta', 'media', 'baja'
    const sendPush = formData.get("send_push") === "on";

    const video_url = formData.get("video_url") as string;

    const { error } = await supabase.from("comunicados").insert({
        titulo,
        contenido,
        prioridad,
        video_url: video_url || null,
        colegio_id: await getColegioId(supabase)
    });

    if (error) return { error: error.message };

    if (sendPush || prioridad === 'alta') {
        console.log(`[PUSH TRIGGERED] Title: ${titulo}, Priority: ${prioridad}`);
    }

    revalidatePath("/dashboard/directora");
    revalidatePath("/dashboard/padre");
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

    revalidatePath("/dashboard/directora");
    revalidatePath("/dashboard/padre");
    return { success: true, timestamp: Date.now() };
}

export async function deleteAllEstudiantesAction(prevState: unknown, formData: FormData) {
    const supabase = await createClient();
    const colegioId = await getColegioId(supabase);
    
    // Safety check: requires 'CONFIRMAR_BORRADO'
    const confirmText = formData.get("confirmacion") as string;
    if (confirmText !== "CONFIRMAR_BORRADO") {
        return { error: "Debe escribir CONFIRMAR_BORRADO exactamente." };
    }

    const { error } = await supabase
        .from("estudiantes")
        .delete()
        .eq("colegio_id", colegioId);

    if (error) return { error: error.message };

    revalidatePath("/dashboard/directora");
    revalidatePath("/dashboard/padre");
    return { success: true, timestamp: Date.now() };
}

export async function approveParentAction(prevState: unknown, formData: FormData) {
    const supabase = await createClient();
    
    // Check security: only director
    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) return { error: "No autorizado" };
    const { data: userProfile } = await supabase.from('perfiles').select('rol').eq('id', userData.user.id).single();
    if (userProfile?.rol !== 'directora') return { error: "Permiso denegado. Solo directores pueden ejecutar esta acción." };

    const parentId = formData.get("parent_id") as string;
    if (!parentId) return { error: "ID de padre no proporcionado." };

    // 1. Obtener el perfil padre para ver el nombre del alumno
    const { data: perfilData, error: perfilError } = await supabase
        .from('perfiles')
        .select('nombre_alumno')
        .eq('id', parentId)
        .single();
    
    if (perfilError) {
        console.error("[APPROVE] Error fetching parent profile:", perfilError.message);
        return { error: "No se pudo encontrar el perfil del padre." };
    }

    // 2. ATOMIC APPROVAL — Update columns
    try {
        let updateError;
        let updateData;
        
        // Intentamos con AdminClient si existe, si no, con el cliente regular (Director)
        if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
            try {
                const adminClient = getAdminClient();
                const res = await adminClient
                    .from("perfiles")
                    .update({ estado_aprobacion: 'aprobado' })
                    .eq('id', parentId)
                    .eq('rol', 'padre')
                    .select('id, email, estado_aprobacion');
                updateError = res.error;
                updateData = res.data;
            } catch (e) {
                console.warn("[APPROVE] AdminClient failed, fallback to regular client.");
                const res = await supabase
                    .from("perfiles")
                    .update({ estado_aprobacion: 'aprobado' })
                    .eq('id', parentId)
                    .eq('rol', 'padre')
                    .select('id, email, estado_aprobacion');
                updateError = res.error;
                updateData = res.data;
            }
        } else {
             const res = await supabase
                .from("perfiles")
                .update({ estado_aprobacion: 'aprobado' })
                .eq('id', parentId)
                .eq('rol', 'padre')
                .select('id, email, estado_aprobacion');
            updateError = res.error;
            updateData = res.data;
        }

        if (updateError) {
            console.error("[APPROVE] Update failed:", updateError.message);
            return { error: `Error al aprobar: ${updateError.message}` };
        }
        if (!updateData || updateData.length === 0) {
            console.error("[APPROVE] No rows updated — padre no encontrado o rol incorrecto");
            return { error: "No se encontró un padre con ese ID o permiso insuficiente." };
        }
        console.log(`[APPROVE] ✅ Padre aprobado correctamente:`, updateData[0]);
    } catch (adminError: any) {
        console.error("[APPROVE] Unexpected error:", adminError);
        return { error: "Hubo un problema de procesamiento. Verifique permisos." };
    }

    // 3. Buscar alumno y crear relación en padres_estudiantes
    const nombreAlumnoSearch = perfilData?.nombre_alumno?.trim();
    if (nombreAlumnoSearch) {
        const { data: estudiantesData } = await supabase
            .from('estudiantes')
            .select('id')
            .ilike('nombre', `%${nombreAlumnoSearch}%`)
            .limit(1);

        if (estudiantesData && estudiantesData.length > 0) {
            const estudianteId = estudiantesData[0].id;
            await supabase.from('estudiantes').update({ padre_id: parentId }).eq('id', estudianteId);
            
            const { data: existingRel } = await supabase
                .from('padres_estudiantes')
                .select('id')
                .eq('padre_id', parentId)
                .eq('estudiante_id', estudianteId)
                .maybeSingle();
                
            if (!existingRel) {
                await supabase.from('padres_estudiantes').insert({
                    padre_id: parentId,
                    estudiante_id: estudianteId,
                    relacion: 'tutor'
                });
            }
        }
    }

    revalidatePath("/dashboard/directora");
    revalidatePath("/dashboard/padre");
    revalidatePath("/espera");
    return { success: true, timestamp: Date.now() };
}

export async function rejectParentAction(prevState: unknown, formData: FormData) {
    const supabase = await createClient();

    // Check security: only director
    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) return { error: "No autorizado" };
    const { data: userProfile } = await supabase.from('perfiles').select('rol').eq('id', userData.user.id).single();
    if (userProfile?.rol !== 'directora') return { error: "Permiso denegado. Solo directores pueden ejecutar esta acción." };

    const parentId = formData.get("parent_id") as string;

    const { error } = await supabase
        .from("perfiles")
        .update({ estado_aprobacion: 'rechazado' })
        .eq('id', parentId)
        .eq('rol', 'padre');

    if (error) return { error: error.message };

    revalidatePath("/dashboard/directora");
    revalidatePath("/espera");
    return { success: true, timestamp: Date.now() };
}


export async function deleteEstudianteAction(id: string) {
    const supabase = await createClient();
    const { error } = await supabase.from("estudiantes").delete().eq("id", id);

    if (error) return { error: error.message };

    revalidatePath("/dashboard/directora");
    revalidatePath("/dashboard/padre");
    return { success: true };
}



export async function approvePaymentAction(pagoId: string) {
    const supabase = await createClient();
    
    // 1. Obtener datos del pago para la notificación
    const { data: pago } = await supabase
        .from("pagos")
        .select("monto, estudiante_id, estudiantes(nombre, padre_id)")
        .eq("id", pagoId)
        .single();

    // 2. Actualizar estado a 'saldado' (Unificación de contabilidad)
    const { error } = await supabase
        .from("pagos")
        .update({ estado: 'saldado' }) 
        .eq('id', pagoId);


    if (error) return { error: error.message };

    // 3. Disparar notificación n8n
    if (pago && pago.estudiantes) {
        const est = pago.estudiantes as any;
        const { data: perfil } = await supabase
            .from("perfiles")
            .select("nombre_completo")
            .eq("id", est.padre_id)
            .single();

        await enviarNotificacionPago(
            perfil?.nombre_completo || "Tutor",
            Number(pago.monto),
            est.nombre
        );
    }

    revalidatePath("/dashboard/directora");
    revalidatePath("/dashboard/padre");
    return { success: true };
}

export async function archivePaymentAction(pagoId: string) {
    const supabase = await createClient();
    const { error } = await supabase
        .from("pagos")
        .update({ estado: 'archivado' })
        .eq('id', pagoId);

    if (error) return { error: error.message };

    revalidatePath("/dashboard/directora");
    revalidatePath("/dashboard/padre");
    return { success: true };
}

export async function deletePaymentAction(pagoId: string) {
    const supabase = await createClient();
    const { error } = await supabase
        .from("pagos")
        .delete()
        .eq('id', pagoId);

    if (error) return { error: error.message };

    revalidatePath("/dashboard/directora");
    revalidatePath("/dashboard/padre");
    return { success: true };
}

export async function rejectPaymentAction(pagoId: string) {
    const supabase = await createClient();
    const { error } = await supabase
        .from("pagos")
        .update({ estado: 'rechazado' })
        .eq('id', pagoId);

    if (error) return { error: error.message };

    revalidatePath("/dashboard/directora");
    revalidatePath("/dashboard/padre");
    return { success: true };
}

export async function deleteComunicadoAction(id: string) {
    const supabase = await createClient();
    const { error } = await supabase.from("comunicados").delete().eq("id", id);

    if (error) return { error: error.message };

    revalidatePath("/dashboard/directora");
    revalidatePath("/dashboard/padre");
    return { success: true };
}

export async function clearComunicadosAction() {
    const supabase = await createClient();
    
    // Obtener colegio_id
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "No autorizado" };
    
    const { data: perfil } = await supabase
        .from("perfiles")
        .select("colegio_id")
        .eq("id", user.id)
        .single();
        
    if (!perfil?.colegio_id) return { error: "No se encontró el colegio" };

    const { error } = await supabase
        .from("comunicados")
        .delete()
        .eq("colegio_id", perfil.colegio_id);

    if (error) return { error: error.message };

    revalidatePath("/dashboard/directora");
    revalidatePath("/dashboard/padre");
    return { success: true };
}



export async function finishReunionAction(id: string) {
    const supabase = await createClient();
    const { error } = await supabase
        .from("solicitudes_reunion")
        .update({ estado: 'finalizada' })
        .eq('id', id);

    if (error) return { error: error.message };

    revalidatePath("/dashboard/padre", "page");
    revalidatePath("/dashboard/directora", "page");
    revalidatePath("/", "layout");
    return { success: true };
}

export async function deleteReunionAction(id: string) {
    const supabase = await createClient();
    const { error } = await supabase
        .from("solicitudes_reunion")
        .delete()
        .eq('id', id);

    if (error) return { error: error.message };

    revalidatePath("/dashboard/padre", "page");
    revalidatePath("/dashboard/directora", "page");
    revalidatePath("/", "layout");
    return { success: true };
}

export async function approveReunionAction(id: string, fecha_cita: string, comentario_directora: string) {
    const supabase = await createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "No autenticado" };
    
    const { error: updateError, data } = await supabase
        .from("solicitudes_reunion")
        .update({ 
            estado: 'aceptada',
            fecha_cita: fecha_cita,
            comentario_directora: comentario_directora
        })
        .eq('id', id)
        .select();

    if (updateError) return { error: updateError.message };
    
    if (!data || data.length === 0) {
        return { error: "Error de persistencia: No se pudo actualizar el registro. Verifica permisos." };
    }

    // Revalidación forzada para el dashboard del padre
    revalidatePath("/dashboard/padre", "page");
    revalidatePath("/dashboard/directora", "page");
    revalidatePath("/", "layout");
    
    return { success: true };
}

export async function rejectReunionAction(id: string) {
    const supabase = await createClient();
    const { error } = await supabase
        .from("solicitudes_reunion")
        .update({ estado: 'rechazado' })
        .eq('id', id);

    if (error) return { error: error.message };

    revalidatePath("/dashboard/padre", "page");
    revalidatePath("/dashboard/directora", "page");
    revalidatePath("/", "layout");
    return { success: true };
}
