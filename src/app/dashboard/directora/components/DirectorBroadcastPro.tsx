"use client";

import React, { useState, useEffect } from 'react';
import { 
  X, Send, Loader2, CheckCircle2, 
  Megaphone, Sparkles, Bell, Heart, 
  Instagram, Youtube, CloudLightning, AlertTriangle 
} from 'lucide-react';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getAuth, signInAnonymously, onAuthStateChanged, Auth, User } from 'firebase/auth';

/**
 * Kinder Hive Hub - Módulo de Avisos Mágicos v3.6 (ULTRA-RESILIENT)
 * Añadidos fallbacks robustos para Firebase Config y variables de entorno.
 */

// --- ESCUDO DE CONFIGURACIÓN ---
const getSafeConfig = () => {
  try {
    // 1. Intento por variable global (Inyectada por el servidor en ciertos dashboards)
    // @ts-ignore
    if (typeof __firebase_config !== 'undefined' && __firebase_config) {
      // @ts-ignore
      const config = typeof __firebase_config === 'string' ? JSON.parse(__firebase_config) : __firebase_config;
      if (config.apiKey) return config;
    }
  } catch (e) {
    console.error("Error con __firebase_config:", e);
  }

  // 2. Fallback a variables de entorno estándar de Next.js
  const fallback = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
  };

  return fallback.apiKey ? fallback : null;
};

// Inicialización ultra-segura
let app: FirebaseApp | undefined, auth: Auth | undefined, db: Firestore | undefined;
const firebaseConfig = getSafeConfig();

if (firebaseConfig) {
  try {
    app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
  } catch (e) {
    console.error("Fallo en inicialización de servicios:", e);
  }
}

// @ts-ignore
const appId = typeof __app_id !== 'undefined' ? __app_id : (process.env.NEXT_PUBLIC_APP_ID || 'default-app-id');

export default function DirectorBroadcastPro({ onClose }: { onClose: () => void }) {
  const [user, setUser] = useState<User | null>(null);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [mediaUrl, setMediaUrl] = useState('');
  const [priority, setPriority] = useState('URGENTE'); 
  const [status, setStatus] = useState<'idle' | 'sending' | 'done' | 'error'>('idle');

  useEffect(() => {
    if (!auth) return;
    try {
      signInAnonymously(auth).catch(err => console.error("Auth Error:", err));
      const unsubscribe = onAuthStateChanged(auth, (u) => setUser(u));
      return () => unsubscribe();
    } catch (e) {
      console.error("Error en el efecto de autenticación:", e);
    }
  }, []);

  const handleConfirmAndSave = async () => {
    if (!message.trim() || !title.trim() || !user) {
      alert("Por favor, completa el título y el mensaje.");
      return;
    }
    
    setStatus('sending');
    const icon = priority === "URGENTE" ? "🚨" : priority === "ADVERTENCIA" ? "⚠️" : "🔔";

    try {
      // URL de producción verificada (Limpia)
      const targetUrl = "https://curso-n8n-n8n.sjia2i.easypanel.host/webhook/alertas-kinder";
      
      const response = await fetch(targetUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tipo_evento: priority === "URGENTE" ? "AVISO URGENTE" : "AVISO ESCOLAR",
          nombre_alumno: "Toda la Comunidad",
          mensaje: `${icon} *${title.toUpperCase()}*\n\n${message}${mediaUrl ? `\n\n🔗 Enlace: ${mediaUrl}` : ""}`,
          is_broadcast: true,
          prioridad: priority,
          timestamp: new Date().toISOString(),
          app_id: appId
        })
      });

      if (response.ok) {
        setStatus('done');
        setTitle(''); setMessage(''); setMediaUrl('');
        setTimeout(() => {
          setStatus('idle');
          onClose(); // Auto-cerrar al terminar con éxito
        }, 3500);
      } else {
        throw new Error("Respuesta de n8n no válida");
      }
    } catch (error) {
      console.error("Send error:", error);
      setStatus('error');
      alert("Error al enviar. Verifique su conexión.");
      setTimeout(() => setStatus('idle'), 3000);
    }
  };

  // Prevenir crash si los datos no están listos
  if (!firebaseConfig) {
    return (
      <div className="fixed inset-0 z-[120] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="bg-white rounded-[2.5rem] p-10 text-center max-w-xs shadow-2xl animate-in zoom-in-95 duration-300">
          <AlertTriangle className="mx-auto mb-4 text-amber-400" size={48} />
          <p className="font-bold text-slate-600">Sistema en Mantenimiento</p>
          <p className="text-sm mt-2 text-slate-400 italic leading-relaxed">La configuración del servidor no se ha detectado correctamente.</p>
          <button 
            onClick={onClose} 
            className="mt-8 w-full py-4 bg-slate-100 hover:bg-slate-200 transition-colors rounded-2xl text-slate-500 font-black uppercase tracking-widest text-[10px]"
          >
            Cerrar Panel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[120] bg-slate-900/60 backdrop-blur-sm flex items-start justify-center p-4 pt-20 overflow-y-auto">
      <div className="bg-white w-full max-w-lg rounded-[3rem] shadow-2xl overflow-hidden border-4 border-white my-8 animate-in fade-in zoom-in duration-500 relative">
        
        {/* Header con Degradado */}
        <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 p-8 pt-12 text-white relative">
          <div className="flex justify-between items-start relative z-10">
            <div className="flex items-center gap-4">
              <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-md border border-white/20">
                <Megaphone size={28} className="text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-black tracking-tighter uppercase italic">Publicar Aviso</h1>
                <p className="text-[10px] font-bold text-white/80 uppercase tracking-widest mt-1">Comunicación Mágica ✨</p>
              </div>
            </div>
            <button onClick={onClose} className="text-white/40 hover:text-white transition-colors"><X size={24} /></button>
          </div>
          <div className="absolute top-2 right-12 text-white/5 rotate-12"><Sparkles size={80} /></div>
        </div>

        {/* Formulario */}
        <div className="p-8 space-y-6">
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Título del aviso</label>
            <input 
              type="text" placeholder="Ej: Suspensión de clases 🌧️" value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-slate-50 border-2 border-slate-100 rounded-full py-4 px-8 text-slate-700 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 font-bold shadow-inner"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Tu Mensaje</label>
            <textarea 
              placeholder="Escribe el mensaje aquí..." value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full bg-slate-50 border-2 border-slate-100 rounded-[2rem] p-6 h-40 text-slate-700 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 resize-none text-sm font-medium shadow-inner"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Link (Instagram/YouTube)</label>
            <div className="relative">
              <div className="absolute left-6 top-1/2 -translate-y-1/2 flex gap-2 text-indigo-400 opacity-60">
                <Instagram size={18} /><Youtube size={18} />
              </div>
              <input 
                type="text" placeholder="Pega el enlace aquí..." value={mediaUrl}
                onChange={(e) => setMediaUrl(e.target.value)}
                className="w-full bg-slate-50 border-2 border-slate-100 rounded-full py-4 pl-20 pr-6 text-slate-700 italic text-sm font-medium shadow-inner"
              />
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            {[
              { id: 'INFORMACIÓN', label: 'Noticia', icon: <Bell size={14}/>, color: 'bg-blue-500' },
              { id: 'ADVERTENCIA', label: 'Atención', icon: <AlertTriangle size={14}/>, color: 'bg-amber-400' },
              { id: 'URGENTE', label: '¡Urgente!', icon: <CloudLightning size={14}/>, color: 'bg-rose-500' }
            ].map((btn) => (
              <button 
                key={btn.id} type="button" onClick={() => setPriority(btn.id)}
                className={`flex-1 flex flex-col items-center gap-1.5 py-4 rounded-[2rem] text-[9px] font-black uppercase transition-all border-4 ${
                  priority === btn.id ? `${btn.color} text-white border-white shadow-xl scale-105` : 'bg-slate-50 text-slate-400 border-slate-50 hover:border-slate-100'
                }`}
              >
                {btn.icon}{btn.label}
              </button>
            ))}
          </div>
        </div>

        <div className="p-10 pt-4">
          <button 
            onClick={handleConfirmAndSave} disabled={status === 'sending'}
            className={`w-full py-6 rounded-full font-black text-sm shadow-2xl transition-all active:scale-95 flex items-center justify-center gap-4 text-white uppercase tracking-widest ${
              status === 'done' ? 'bg-emerald-500' : 'bg-[#8b2ce2] hover:bg-black'
            }`}
          >
            {status === 'sending' ? <Loader2 className="animate-spin" size={20} /> : <><Send size={20} className="rotate-45" /> Confirmar y Enviar</>}
          </button>
        </div>
      </div>
    </div>
  );
}
