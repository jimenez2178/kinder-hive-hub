/**
 * Función global para notificar a los padres vía Telegram mediante n8n.
 * 
 * @param tipo - El tipo de alerta (ej: "Asistencia", "Salida", "Pagos")
 * @param mensaje - El texto descriptivo de la alerta
 * @param perfilPadre - Objeto con el nombre del hijo y el ID de Telegram vinculado
 */
export async function notifyParent(tipo: string, mensaje: string, perfilPadre: { hijo_nombre: string, telegram_chat_id: string }) {
  if (!perfilPadre.telegram_chat_id) {
    console.warn("No hay ID de Telegram para el padre de", perfilPadre.hijo_nombre);
    return;
  }

  const url = "https://curso-n8n-n8n.sjia2i.easypanel.host/webhook/alertas-kinder";
  const payload = {
    tipo_evento: tipo,
    nombre_alumno: perfilPadre.hijo_nombre,
    mensaje: mensaje,
    telegram_chat_id: perfilPadre.telegram_chat_id
  };

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Error en el webhook: ${response.statusText}`);
    }

    console.log("Notificación enviada con éxito a Telegram via n8n");
    return { success: true };
  } catch (error) {
    console.error("Error al enviar notificación a n8n:", error);
    return { success: false, error };
  }
}
