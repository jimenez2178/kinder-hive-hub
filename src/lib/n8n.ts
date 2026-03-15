export async function getFraseDelDia(): Promise<string> {
    try {
        const res = await fetch("https://curso-n8n-n8n.sjia2i.easypanel.host/webhook/frase-del-dia", {
            next: { revalidate: 3600 } // Cache for 1 hour
        });
        if (!res.ok) return "Educando con amor y propósito.";
        const data = await res.json();
        return data.frase || "Educando con amor y propósito.";
    } catch (error) {
        console.error("Error fetching n8n webhook:", error);
        return "Educando con amor y propósito.";
    }
}
export async function enviarNotificacionPago(nombrePadre: string, monto: number, nombreEstudiante: string) {
    try {
        await fetch("https://curso-n8n-n8n.sjia2i.easypanel.host/webhook/notificacion-pago", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                nombrePadre,
                monto,
                nombreEstudiante,
                fecha: new Date().toLocaleDateString('es-DO'),
                mensaje: `¡Hola ${nombrePadre}! Tu pago de RD$ ${monto.toLocaleString()} por ${nombreEstudiante} ha sido validado correctamente. Gracias por tu puntualidad.`
            })
        });
    } catch (error) {
        console.error("Error al enviar notificación a n8n:", error);
    }
}

export async function enviarNotificacionRegistro(email: string, nombreCompleto: string) {
    try {
        await fetch("https://curso-n8n-n8n.sjia2i.easypanel.host/webhook/registro-padre", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                email,
                nombreCompleto,
                fecha: new Date().toLocaleDateString('es-DO'),
                mensaje: `Nueva solicitud de registro: ${nombreCompleto} (${email}). Pendiente de aprobación en el panel administrativo.`
            })
        });
    } catch (error) {
        console.error("Error al enviar notificación de registro a n8n:", error);
    }
}
