# Memoria del Proyecto: Kinder Hive Hub

## Estado Actual (Fase de Branding y PWA)
*   **Iconos y Branding**: Iconos de la App actualizados para eliminar el logo de Vercel y mostrar el de Kinder Hive Hub (KHH). Soporte para PWA mejorado en `manifest.json`.

*   **Infraestructura de Notificaciones**:
    *   **Service Worker**: `public/sw.js` creado para gestionar la recepción de notificaciones en segundo plano.
    *   **Manejador de Notificaciones**: Componente `PushNotificationManager.tsx` integrado en el layout global para solicitar permisos y registrar el SW.
*   **Sincronización con Base de Datos**:
    *   **Esquema**: Se requiere la columna `push_token` en la tabla `perfiles` para vincular dispositivos con usuarios.
*   **Lógica de Disparadores (Backend)**:
    *   **Comunicados**: Incorporado un interruptor (Switch) en el modal de la Directora para forzar el envío Push. Los avisos de prioridad "Alta" disparan la alerta automáticamente.
    *   **Pagos y Fotos**: Se han preparado los "hooks" en las acciones del servidor para disparar notificaciones personalizadas al detectar transacciones o nuevas imágenes.
*   **Interfaz Directiva**:
    *   Añadido un switch estético con la identidad visual de la marca (Púrpura #8A2BE2) para control de notificaciones.

## Reglas de Marca
*   Acentuación Push: Púrpura (#8A2BE2).
*   Header Premium: Azul Marino Oxford (#002147) con Texto Blanco.
*   Bloques de Reporte: Azul Cielo Suave (#E1F5FE) con Texto Navy.

## Decisiones Técnicas
*   Se optó por una arquitectura desacoplada: el frontend registra el token y el backend (acciones del servidor) dispara la lógica de envío.
*   Uso de `navigator.serviceWorker` para compatibilidad con Progressive Web Apps (PWA).
