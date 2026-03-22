import React, { useState, useEffect } from 'react';
import { 
  X, Send, Loader2, CheckCircle2, 
  Megaphone, Sparkles, Bell, Heart, 
  Instagram, Youtube, CloudLightning, AlertTriangle 
} from 'lucide-react';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';

// --- CONFIGURACIÓN DE INFRAESTRUCTURA ---
const getSafeConfig = () => {
  try {
    // @ts-ignore
    if (typeof __firebase_config !== 'undefined' && __firebase_config) {
      // @ts-ignore
      return typeof __firebase_config === 'string' ? JSON.parse(__firebase_config) : __firebase_config;
    }
    if (process.env.NEXT_PUBLIC_FIREBASE_CONFIG) {
      return JSON.parse(process.env.NEXT_PUBLIC_FIREBASE_CONFIG);
    }
  } catch (e) { console.error("Config Error:", e); }
  return null;
};

const firebaseConfig = getSafeConfig();
let app: any, auth: any, db: any;

if (firebaseConfig && firebaseConfig.apiKey) {
  try {
    app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
  } catch (e) { console.error("Firebase Error:", e); }
}

const appId = typeof window !== 'undefined' && (window as any).__app_id ? (window as any).__app_id : (process.env.NEXT_PUBLIC_APP_ID || 'default-app-id');

export default function DirectorBroadcastPro({ onClose }: { onClose?: () => void }) {
  const [user, setUser] = useState<any>(null);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [mediaUrl, setMediaUrl] = useState('');
  const [priority, setPriority] = useState('URGENTE'); 
  const [status, setStatus] = useState('idle');

  useEffect(() => {
    if (!auth) return;
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
      } else {
        signInAnonymously(auth).catch(err => console.error("Auth Fail:", err));
      }
    });
    return () => unsubscribe();
  }, []);

  const handleConfirmAndSave = async () => {
    if (!message.trim() || !title.trim()) {
      alert("Por favor, completa el título y el mensaje.");
      return;
    }
    
    setStatus('sending');
    const icon = priority === "URGENTE" ? "🚨" : priority === "ADVERTENCIA" ? "⚠️" : "🔔";

    try {
      // 1. PERSISTENCIA EN FIRESTORE (Para Dashboard del Padre)
      if (db) {
        const avisosRef = collection(db, 'artifacts', appId, 'public', 'data', 'avisos');
        await addDoc(avisosRef, {
          titulo: title,
          mensaje: message,
          media_url: mediaUrl,
          prioridad: priority,
          fecha: serverTimestamp(),
          autor: "Dirección Escolar"
        });
      }

      // 2. DISPARO A WEBHOOK (Telegram)
      const response = await fetch("https://curso-n8n-n8n.sjia2i.easypanel.host/webhook/alertas-kinder", {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tipo_evento: priority === "URGENTE" ? "AVISO URGENTE" : "AVISO ESCOLAR",
          nombre_alumno: "Comunidad Escolar", 
          mensaje: `${icon} *${title.toUpperCase()}*\n\n${message}${mediaUrl ? `\n\n🔗 Ver más: ${mediaUrl}` : ""}`,
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
          if (onClose) onClose();
        }, 2000);
      } else {
        throw new Error("Error en n8n");
      }
    } catch (error) {
      console.error("Critical Send error:", error);
      setStatus('error');
      alert("Hubo un problema al procesar el aviso.");
      setTimeout(() => setStatus('idle'), 3000);
    }
  };

  return (
    /* EL FIX: Contenedor fixed con z-index alto para evitar renderizado al final del dashboard */
    <div className="fixed inset-0 z-[9999] flex items-start justify-center overflow-y-auto bg-slate-900/70 backdrop-blur-sm p-4 pt-10 md:pt-20 animate-in fade-in duration-300">
      
      <div className="relative w-full max-w-lg bg-white rounded-[3.5rem] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.5)] overflow-hidden border-4 border-white mb-20 animate-in zoom-in duration-500">
        
        {/* Header con Cierre */}
        <div className="bg-gradient-to-r from-[#6366f1] via-[#a855f7] to-[#ec4899] p-8 pt-12 text-white relative">
          <div className="flex justify-between items-start relative z-10">
            <div className="flex items-center gap-4">
              <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-lg border border-white/30 shadow-inner">
                <Megaphone size={28} className="text-white drop-shadow-md" />
              </div>
              <div>
                <h1 className="text-2xl font-black tracking-tighter uppercase italic leading-tight">Publicar Aviso</h1>
                <p className="text-[10px] font-bold text-white/80 uppercase tracking-widest mt-1 italic">Sincronización Total ✨</p>
              </div>
            </div>
            {onClose && (
              <button 
                onClick={onClose}
                className="bg-white/10 p-2.5 rounded-full hover:bg-white/20 transition-all border border-white/20 active:scale-90"
              >
                <X size={24} />
              </button>
            )}
          </div>
          <div className="absolute top-2 right-12 text-white/10 rotate-12"><Sparkles size={80} /></div>
        </div>

        {/* Formulario */}
        <div className="p-8 space-y-6">
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Título del aviso</label>
            <input 
              type="text" placeholder="Ej: Suspensión de clases 🌧️" value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-slate-50 border-2 border-slate-100 rounded-full py-4.5 px-8 text-slate-700 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 font-bold shadow-inner"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Tu Mensaje</label>
            <textarea 
              placeholder="Escribe el mensaje aquí..." value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full bg-slate-50 border-2 border-slate-100 rounded-[2rem] p-8 h-40 text-slate-700 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 resize-none text-sm font-medium leading-relaxed shadow-inner"
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
                  priority === btn.id ? `${btn.color} text-white border-white shadow-xl scale-105 -translate-y-1` : 'bg-slate-50 text-slate-400 border-slate-50'
                }`}
              >
                {btn.icon}{btn.label}
              </button>
            ))}
          </div>
        </div>

        <div className="p-10 pt-4">
          <button 
            type="button" onClick={handleConfirmAndSave} disabled={status === 'sending'}
            className={`w-full py-6 rounded-full font-black text-sm shadow-2xl transition-all active:scale-95 flex items-center justify-center gap-4 text-white uppercase tracking-widest ${
              status === 'done' ? 'bg-emerald-500' : 'bg-gradient-to-r from-indigo-600 to-purple-600'
            }`}
          >
            {status === 'sending' ? <Loader2 className="animate-spin" size={20} /> : <><Send size={20} className="rotate-45" /> Publicar Aviso</>}
          </button>
        </div>
      </div>
    </div>
  );
}
