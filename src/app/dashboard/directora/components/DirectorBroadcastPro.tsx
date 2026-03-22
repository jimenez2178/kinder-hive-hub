"use client";

import React, { useState, useEffect } from 'react';
import { 
  X, Send, Loader2, AlertTriangle, CheckCircle2, 
  Megaphone, Sparkles, Bell, Heart, 
  Instagram, Youtube, CloudLightning 
} from 'lucide-react';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';

/**
 * Kinder Hive Hub - Módulo de Avisos Mágicos v3.1
 * Diseño: Soluciones Jiménez
 * Estado: Corregido para Producción (URL n8n limpia)
 */

// --- CONFIGURACIÓN DE INFRAESTRUCTURA ---
// Se asume que __firebase_config y __app_id están definidos globalmente o inyectados
const getFirebaseConfig = () => {
    try {
        if (typeof window !== 'undefined' && (window as any).__firebase_config) {
            return JSON.parse((window as any).__firebase_config);
        }
    } catch (e) {
        console.error("Error parsing __firebase_config:", e);
    }
    return {
        apiKey: "AIzaSy...",
        authDomain: "kinder-hive.firebaseapp.com",
        projectId: "kinder-hive",
        storageBucket: "kinder-hive.appspot.com",
        messagingSenderId: "123456789",
        appId: "1:123456789:web:abcdef"
    };
};

const app = getApps().length > 0 ? getApp() : initializeApp(getFirebaseConfig());
const db = getFirestore(app);
const auth = getAuth(app);

interface DirectorBroadcastProProps {
    onClose: () => void;
}

export default function DirectorBroadcastPro({ onClose }: DirectorBroadcastProProps) {
  const [user, setUser] = useState<unknown>(null);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [mediaUrl, setMediaUrl] = useState('');
  const [priority, setPriority] = useState('URGENTE'); 
  const [status, setStatus] = useState<'idle' | 'sending' | 'done' | 'error'>('idle');

  useEffect(() => {
    signInAnonymously(auth).catch(err => console.error("Error en auth:", err));
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  const handleConfirmAndSave = async () => {
    if (!message || !title || !user) return;
    
    setStatus('sending');
    const icon = priority === "URGENTE" ? "🚨" : priority === "ADVERTENCIA" ? "⚠️" : "🔔";

    try {
      // URL LIMPIA PARA EL WEBHOOK
      const response = await fetch("https://curso-n8n-n8n.sjia2i.easypanel.host/webhook/alertas-kinder", {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tipo_evento: priority === "URGENTE" ? "AVISO URGENTE" : "COMUNICADO",
          nombre_alumno: "Dirección Académica",
          mensaje: `${icon} *${title.toUpperCase()}*\n\n${message}${mediaUrl ? `\n\n🔗 Ver Foto/Video: ${mediaUrl}` : ""}`,
          is_broadcast: true,
          prioridad: priority,
          timestamp: new Date().toISOString(),
          enviado_por: "Dirección Escolar"
        })
      });

      if (response.ok) {
        setStatus('done');
        setTitle('');
        setMessage('');
        setMediaUrl('');
        setTimeout(() => setStatus('idle'), 3500);
      } else {
        throw new Error("Error en n8n");
      }
    } catch (error) {
      console.error("Fallo en el envío masivo:", error);
      setStatus('error');
      setTimeout(() => setStatus('idle'), 3000);
    }
  };

  return (
    <div className="fixed inset-0 z-[120] bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 flex items-center justify-center p-4 font-sans text-slate-800 overflow-y-auto">
      
      <div className="bg-white w-full max-w-lg rounded-[3.5rem] shadow-[0_30px_60px_rgba(0,0,0,0.12)] overflow-hidden border-4 border-white animate-in fade-in zoom-in duration-500 my-8">
        
        {/* Encabezado Alegre con Degradado */}
        <div className="bg-gradient-to-r from-[#6366f1] via-[#a855f7] to-[#ec4899] p-8 text-white relative">
          <div className="flex justify-between items-start relative z-10">
            <div className="flex items-center gap-4">
              <div className="bg-white/20 p-3.5 rounded-2xl backdrop-blur-lg border border-white/30 shadow-inner">
                <Megaphone size={32} className="text-white drop-shadow-md" />
              </div>
              <div>
                <h1 className="text-3xl font-black tracking-tighter uppercase italic">¡Publicar Aviso!</h1>
                <p className="text-[10px] font-bold text-white/80 uppercase tracking-[0.2em] mt-1">Comunicación Mágica ✨</p>
              </div>
            </div>
            <button 
                onClick={onClose}
                className="bg-white/10 p-2 rounded-full hover:bg-white/20 transition-colors"
                aria-label="Cerrar"
            >
              <X size={24} />
            </button>
          </div>
          <div className="absolute top-2 right-16 text-white/10 rotate-12"><Sparkles size={80} /></div>
          <div className="absolute -bottom-6 -left-6 text-white/10 -rotate-12"><Heart size={100} /></div>
        </div>

        {/* Formulario Estilo Colegio */}
        <div className="p-8 space-y-5">
          <div className="space-y-1">
            <label className="text-[11px] font-black text-indigo-400 uppercase tracking-widest ml-5">Título del aviso</label>
            <input 
              type="text" 
              placeholder="Ej: ¡Mañana celebramos con colores! 🌈"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-slate-50 border-2 border-slate-100 rounded-full py-4 px-8 text-slate-700 focus:outline-none focus:ring-4 focus:ring-purple-500/10 focus:border-purple-400 shadow-inner font-semibold"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-black text-indigo-400 uppercase tracking-widest ml-5">Tu Mensaje</label>
            <textarea 
              placeholder="Cuenta las novedades aquí..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full bg-slate-50 border-2 border-slate-100 rounded-[2.5rem] p-8 h-36 text-slate-700 placeholder:text-slate-300 focus:outline-none focus:ring-4 focus:ring-purple-500/10 focus:border-purple-400 shadow-inner resize-none text-sm font-medium"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-black text-indigo-400 uppercase tracking-widest ml-5">Link de Instagram o YouTube</label>
            <div className="relative">
              <div className="absolute left-6 top-1/2 -translate-y-1/2 flex gap-2 text-indigo-400 opacity-60">
                <Instagram size={18} />
                <Youtube size={18} />
              </div>
              <input 
                type="text" 
                placeholder="Pega el enlace aquí..."
                value={mediaUrl}
                onChange={(e) => setMediaUrl(e.target.value)}
                className="w-full bg-slate-50 border-2 border-slate-100 rounded-full py-4 pl-20 pr-6 text-slate-700 italic text-sm font-medium shadow-inner"
              />
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <p className="text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Nivel de importancia</p>
            <div className="flex gap-3">
              {[
                { id: 'INFORMACIÓN', label: 'Noticia', icon: <Bell size={14}/>, color: 'bg-blue-500 shadow-blue-100' },
                { id: 'ADVERTENCIA', label: 'Atención', icon: <AlertTriangle size={14}/>, color: 'bg-amber-400 shadow-amber-100' },
                { id: 'URGENTE', label: '¡Urgente!', icon: <CloudLightning size={14}/>, color: 'bg-rose-500 shadow-rose-100' }
              ].map((btn) => (
                <button 
                  key={btn.id}
                  onClick={() => setPriority(btn.id)}
                  className={`flex-1 flex flex-col items-center gap-1.5 py-4 rounded-[2rem] text-[10px] font-black uppercase transition-all border-4 ${
                    priority === btn.id 
                      ? `${btn.color} text-white border-white shadow-2xl scale-110 -translate-y-1.5` 
                      : 'bg-slate-50 text-slate-400 border-slate-50 hover:border-slate-100'
                  }`}
                >
                  {btn.icon}
                  {btn.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Botón de Envío Masivo */}
        <div className="p-10 pt-0">
          <button 
            onClick={handleConfirmAndSave}
            disabled={status === 'sending' || !message || !title}
            className={`w-full py-6.5 rounded-full font-black text-lg shadow-xl transition-all active:scale-95 flex items-center justify-center gap-4 text-white ${
              status === 'done' ? 'bg-emerald-500' : 'bg-gradient-to-r from-indigo-600 to-purple-600'
            }`}
          >
            {status === 'sending' ? (
              <><Loader2 className="animate-spin" size={24} /> ¡Difundiendo!</>
            ) : status === 'done' ? (
              <><CheckCircle2 size={24} /> ¡Aviso Enviado!</>
            ) : (
              <><span className="uppercase italic">Confirmar y Enviar</span> <Send size={24} className="rotate-45" /></>
            )}
          </button>
          <p className="w-full mt-5 text-center text-slate-300 font-black text-[10px] uppercase tracking-[0.3em]">
            Kinder Hive Hub v3.1 • Soluciones Jiménez
          </p>
        </div>
      </div>
    </div>
  );
}
