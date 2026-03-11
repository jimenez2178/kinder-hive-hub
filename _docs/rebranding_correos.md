# Rebranding de Correos Automáticos 📧

Para completar la identidad visual, aquí tienes el fragmento de HTML que debes integrar en el pie de página (footer) de tus correos automáticos (ya sea en n8n, Supabase Auth o Resend).

### Fragmento HTML para el Footer
Copia y pega este código al final de tus plantillas de correo:

```html
<!-- Footer Rebranding -->
<div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0; text-align: center; font-family: sans-serif;">
    <img src="https://informativolatelefonica.com/wp-content/uploads/2021/05/logo-psicopedagogico-sagrada-familia.png" 
         alt="Logo Sagrada Familia" 
         style="width: 80px; height: auto; margin-bottom: 10px;">
    
    <h2 style="color: #004aad; font-size: 16px; margin: 0; text-transform: uppercase; font-weight: 900;">
        Pre-escolar Psicopedagógico de la Sagrada Familia
    </h2>
    
    <p style="color: #8A2BE2; font-size: 10px; margin: 5px 0; font-weight: bold; text-transform: uppercase; letter-spacing: 1px;">
        Educando con Amor y Propósito
    </p>
    
    <p style="color: #64748b; font-size: 11px; margin-top: 15px;">
        Este es un mensaje automático del Sistema de Gestión Escolar.
        <br>
        Santo Domingo, República Dominicana.
    </p>
</div>
```

### Instrucciones de Aplicación:

1. **En n8n**: Si el envío se hace mediante un nodo de Gmail, Outlook o Resend, asegúrate de que el cuerpo del mensaje esté en formato **HTML** y pega el código anterior al final.
2. **En Supabase (Auth)**:
   - Ve a **Authentication** > **Email Templates**.
   - En cada plantilla (Confirmación, Reset Password, etc.), añade el fragmento al final del editor HTML.
3. **Estilo**: He utilizado el **Azul (#004aad)** para el nombre y el **Púrpura (#8A2BE2)** para el eslogan para mantener la coherencia con el Dashboard.
