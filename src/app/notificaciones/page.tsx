"use client";

import React, { useState, useEffect } from 'react';
import { Bell, BellRing, BellOff, Send, ShieldCheck, AlertCircle, CheckCircle2, X, Loader2, ArrowLeft, CreditCard } from 'lucide-react';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import { getAuth, onAuthStateChanged, signInAnonymously } from 'firebase/auth';
import { getMessaging, getToken } from 'firebase/messaging';
import Link from 'next/link';

// --- CONFIGURACIÓN DE FIREBASE (Placeholder seguro) ---
// En producción, estas variables deben venir de .env.local o estar inyectadas en el global scope
const defaultConfig = {
  apiKey: "AIzaSy...",
  authDomain: "kinder-hive.firebaseapp.com",
  projectId: "kinder-hive",
  storageBucket: "kinder-hive.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef"
};

const getFirebaseConfig = () => {
  try {
    // Intentamos leer de la variable inyectada sugerida por el CTO o del entorno
    if (typeof window !== 'undefined' && (window as any).__firebase_config) {
      return JSON.parse((window as any).__firebase_config);
    }
    return defaultConfig;
  } catch (e) {
    return defaultConfig;
  }
};

const firebaseConfig = getFirebaseConfig();
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

export default function NotificacionesPage() {
  const [user, setUser] = useState<any>(null);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null);
  const [isSupported, setIsSupported] = useState(true);
  const [isIOS, setIsIOS] = useState(false);
  const [fcmToken, setFcmToken] = useState<string | null>(null);

  useEffect(() => {
    const initAuth = async () => {
      try {
        await signInAnonymously(auth);
      } catch (error) {
        console.error("Error de auth:", error);
      }
    };
    initAuth();

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    if (typeof window !== 'undefined') {
      const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
      setIsIOS(isIOSDevice);

      if (!('Notification' in window) || !('serviceWorker' in navigator)) {
        setIsSupported(false);
      } else {
        setPermission(Notification.permission);
      }
    }

    return () => unsubscribe();
  }, []);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handleRequestPermission = async () => {
    if (!isSupported) {
      showToast("Tu navegador no soporta notificaciones push.", "error");
      return;
    }

    setLoading(true);
    try {
      const result = await Notification.requestPermission();
      setPermission(result);

      if (result === 'granted') {
        await saveTokenToFirestore();
        showToast("¡Alertas activadas con éxito! Ya recibirás avisos del colegio.");
        
        new Notification("Kinder Hive Hub", {
          body: "¡Bienvenido! Las notificaciones del Sagrada Familia están activas.",
          icon: "/icons/icon-192x192.png"
        });
      } else {
        showToast("Permiso denegado. No podremos enviarte alertas.", "error");
      }
    } catch (error) {
      console.error(error);
      showToast("Error al activar notificaciones.", "error");
    } finally {
      setLoading(false);
    }
  };

  const saveTokenToFirestore = async () => {
    if (!user) return;
    
    try {
      const messaging = getMessaging(app);
      const token = await getToken(messaging, {
        vapidKey: 'BCIg0zxMasMJWYX0DR-Ve7QKyVGw0zflu4QgEf7mMCbzMZ0YGNmZg7DiNymOFBMCJaCQFglAa5eXw5qel9qWdd0'
      });

      if (token) {
        console.log("Token generado con éxito:", token);
        setFcmToken(token);
        
        const appId = (typeof window !== 'undefined' && (window as any).__app_id) || 'kinder-hive-hub';
        const userRef = doc(db, 'artifacts', appId, 'users', user.uid, 'settings', 'notifications');
        await setDoc(userRef, {
          enabled: true,
          fcmToken: token,
          lastUpdated: new Date().toISOString(),
          platform: navigator.platform,
          userAgent: navigator.userAgent
        }, { merge: true });
      } else {
        console.warn("No se pudo obtener el token de registro.");
      }
    } catch (error) {
      console.error("Error obteniendo token FCM:", error);
      showToast("Error al vincular dispositivo.", "error");
    }
  };

  const sendTestNotification = () => {
    if (permission !== 'granted') {
      showToast("Primero debes activar las notificaciones.", "error");
      return;
    }

    const titles = ["¡Pago Registrado!", "Nuevo Aviso Escolar", "Progreso Académico", "Hijo Entregado"];
    const bodies = [
      "Se ha confirmado el pago de colegiatura de Marzo.",
      "Mañana no hay clases por asamblea docente.",
      "Se ha subido el boletín mensual de Isabella.",
      "Tu hijo ha sido retirado por su tutor autorizado."
    ];
    
    const randomIndex = Math.floor(Math.random() * titles.length);

    showToast("Enviando alerta de prueba... Bloquea tu celular o sal de la pestaña.");

    setTimeout(() => {
      new Notification(titles[randomIndex], {
        body: bodies[randomIndex],
        icon: "https://cdn-icons-png.flaticon.com/512/1041/1041916.png",
      });
    }, 3000);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center p-6 font-sans text-slate-900 pb-20">
      <div className="w-full max-w-md flex items-center justify-between mb-8">
        <Link href="/dashboard/padre" className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-400">
           <ArrowLeft size={24} />
        </Link>
        <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Ajustes de Sistema</span>
      </div>

      {toast && (
        <div className={`fixed top-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 p-4 rounded-[25px] shadow-2xl animate-in fade-in slide-in-from-top-4 duration-300 ${
          toast.type === 'error' ? 'bg-rose-600 text-white' : 'bg-[#10B981] text-white'
        }`}>
          {toast.type === 'error' ? <AlertCircle size={20} /> : <CheckCircle2 size={20} />}
          <p className="font-bold text-sm tracking-tight">{toast.message}</p>
          <button onClick={() => setToast(null)} className="ml-2 opacity-50"><X size={18} /></button>
        </div>
      )}

      <header className="w-full max-w-md mb-10 text-center">
        <div className="bg-[#002147] w-20 h-20 rounded-[30px] flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-blue-900/20 transform -rotate-3 transition-transform hover:rotate-0">
          <BellRing className="text-white" size={36} />
        </div>
        <h1 className="text-4xl font-black text-[#002147] tracking-tighter">Centro de Alertas</h1>
        <p className="text-slate-500 mt-3 font-medium">Configura cómo quieres recibir noticias del Sagrada Familia</p>
      </header>

      <main className="w-full max-w-md space-y-6">
        {isIOS && (
          <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-[20px] flex items-start gap-3 animate-in fade-in slide-in-from-bottom-2 duration-700">
            <div className="bg-amber-100 p-2 rounded-xl">
              <ShieldCheck className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-xs font-black text-amber-900 uppercase mb-1">Usuario de iOS Detectado</p>
              <p className="text-xs text-amber-800 leading-relaxed">
                Para recibir sonidos y alertas, debes **añadir esta app a tu pantalla de inicio** y abrirla desde allí.
              </p>
            </div>
          </div>
        )}

        <div className="bg-white p-8 rounded-[40px] shadow-2xl shadow-slate-200/50 border border-slate-50 flex flex-col items-center text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-full blur-3xl -mr-16 -mt-16"></div>
          
          <div className={`w-24 h-24 rounded-full flex items-center justify-center mb-6 relative z-10 ${
            permission === 'granted' ? 'bg-emerald-50 text-emerald-600 shadow-inner' : 'bg-amber-50 text-amber-600 shadow-inner'
          }`}>
            {permission === 'granted' ? <ShieldCheck size={48} className="animate-pulse" /> : <Bell size={48} />}
          </div>
          
          <h2 className="text-2xl font-black text-[#002147] tracking-tight relative z-10">
            {permission === 'granted' ? '¡Todo Listo!' : 'Alertas Desactivadas'}
          </h2>
          <p className="text-slate-500 mt-3 mb-10 text-sm font-medium leading-relaxed relative z-10">
            {permission === 'granted' 
              ? 'Tu dispositivo está vinculado. Recibirás sonidos y avisos importantes instantáneamente.' 
              : 'Es vital activar las alertas para informarte sobre pagos, cambios de horario y seguridad de salida.'}
          </p>

          {permission !== 'granted' ? (
            <button
              onClick={handleRequestPermission}
              disabled={loading || !isSupported}
              className="w-full bg-[#002147] hover:bg-[#003785] text-white font-black py-5 px-8 rounded-[30px] shadow-2xl shadow-blue-900/30 transition-all flex items-center justify-center gap-4 active:scale-95 disabled:opacity-50 group grow-0"
            >
              {loading ? <Loader2 size={24} className="animate-spin text-white" /> : (
                <>
                  Activar Alertas Ahora
                  <BellRing size={20} className="group-hover:animate-shake" />
                </>
              )}
            </button>
          ) : (
            <div className="w-full p-5 bg-emerald-50 border-2 border-emerald-100 rounded-[30px] text-emerald-700 font-black flex items-center justify-center gap-3 uppercase text-xs tracking-widest">
              <CheckCircle2 size={20} />
              Conexión Establecida
            </div>
          )}
        </div>

        <div className="bg-slate-900 p-8 rounded-[40px] shadow-2xl shadow-blue-900/10 text-white relative overflow-hidden">
          <div className="absolute bottom-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl -mr-16 -mb-16"></div>
          
          <div className="flex items-center gap-5 mb-8 relative z-10">
            <div className="bg-white/10 p-4 rounded-[20px] backdrop-blur-md border border-white/10">
              <Send size={28} className="text-blue-400" />
            </div>
            <div>
              <h3 className="font-black text-xl tracking-tight">Prueba de Sonido</h3>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-0.5">Test de infraestructura</p>
            </div>
          </div>

          <button
            onClick={sendTestNotification}
            className="w-full bg-white text-[#002147] hover:bg-slate-100 font-black py-4 px-8 rounded-[25px] transition-all flex items-center justify-center gap-4 active:scale-95 relative z-10 mb-4"
          >
            Enviar Prueba de Alerta
          </button>
          
          <p className="text-[10px] text-slate-500 text-center italic font-bold tracking-tight uppercase">
            * Bloquea la pantalla al presionar para ver el aviso.
          </p>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <h3 className="font-black text-[#002147] text-xs uppercase tracking-[0.2em]">Canales Activos</h3>
            <span className="h-[2px] w-20 bg-slate-200"></span>
          </div>
          
          <div className="bg-white rounded-[25px] p-5 flex items-center justify-between border border-slate-100 shadow-sm transition-all hover:border-blue-100">
            <div className="flex items-center gap-4">
              <div className="bg-blue-50 p-3 rounded-[15px] text-blue-600">
                <ShieldCheck size={20} />
              </div>
              <div>
                <span className="font-extrabold text-[#002147] text-sm block">Seguridad de Salida</span>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Instantáneo</span>
              </div>
            </div>
            <div className="w-12 h-7 bg-[#10B981] rounded-full relative shadow-inner">
              <div className="absolute right-1 top-1 w-5 h-5 bg-white rounded-full shadow-md"></div>
            </div>
          </div>

          <div className="bg-white rounded-[25px] p-5 flex items-center justify-between border border-slate-100 shadow-sm transition-all hover:border-purple-100">
            <div className="flex items-center gap-4">
              <div className="bg-purple-50 p-3 rounded-[15px] text-purple-600">
                <CreditCard size={20} />
              </div>
              <div>
                <span className="font-extrabold text-[#002147] text-sm block">Pagos y Recibos</span>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Prioridad Alta</span>
              </div>
            </div>
            <div className="w-12 h-7 bg-[#10B981] rounded-full relative shadow-inner">
              <div className="absolute right-1 top-1 w-5 h-5 bg-white rounded-full shadow-md"></div>
            </div>
          </div>
        </div>
      </main>

      <footer className="mt-12 text-slate-400 text-[10px] font-black uppercase tracking-[0.4em] text-center">
        Kinder Hive Hub Security v2.0 <br/>
        <span className="text-slate-300 opacity-50">Authorized by Soluciones Jimenez</span>
      </footer>
    </div>
  );
}
