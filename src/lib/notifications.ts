/**
 * Función global para notificar a los padres vía Telegram mediante n8n.
 * 
 * @param tipo - El tipo de alerta (ej: "Asistencia", "Salida", "Pagos")
 * @param mensaje - El texto descriptivo de la alerta
 * @param perfilPadre - Objeto con el nombre del hijo y el ID de Telegram vinculado
 */
export async function notifyParent(tipo: string, mensaje: string, perfilPadre: { hijo_nombre: string, telegram_chat_id: string }) {
  // Alerta para depuración visual (Solo en Cliente)
  if (typeof window !== 'undefined') {
    alert(`DEBUG: Enviando Webhook de ${tipo} para ${perfilPadre.hijo_nombre}`);
  }

  console.log(`🚀 [AUDITORÍA N8N] Disparando Webhook: ${tipo} para ${perfilPadre.hijo_nombre}`);

  if (!perfilPadre.telegram_chat_id) {
    console.warn(`[AUDITORÍA N8N] ⚠️ No hay ID de Telegram para: ${perfilPadre.hijo_nombre}`);
    return { success: false, error: "Missing Telegram ID" };
  }

  const url = process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL || "https://curso-n8n-n8n.sjia2i.easypanel.host/webhook/alertas-kinder";
  const payload = {
    tipo_evento: tipo,
    nombre_alumno: perfilPadre.hijo_nombre,
    mensaje: mensaje,
    telegram_chat_id: String(perfilPadre.telegram_chat_id),
    timestamp: new Date().toISOString()
  };

  console.log("[AUDITORÍA N8N] Payload:", JSON.stringify(payload, null, 2));

  // Alerta solicitada por el usuario para confirmar ejecución en cliente
  if (typeof window !== 'undefined') {
    alert("🚀 Disparando señal al webhook de n8n...");
  }

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[AUDITORÍA N8N] ❌ Error HTTP: ${response.status} - ${errorText}`);
      throw new Error(`Error en el webhook: ${response.statusText}`);
    }

    console.log("[AUDITORÍA N8N] ✅ Notificación enviada con éxito.");
    return { success: true };
  } catch (error) {
    console.error("[AUDITORÍA N8N] ❌ Error excepcional:", error);
    return { success: false, error };
  }
}
