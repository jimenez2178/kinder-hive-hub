"use client";

import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  Clock, 
  XCircle, 
  User, 
  Search, 
  Save, 
  Calendar,
  ClipboardList,
  MessageSquare,
  ShieldCheck,
  Megaphone,
  Send,
  UserCheck
} from 'lucide-react';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  getDocs, 
  doc, 
  setDoc 
} from 'firebase/firestore';
import { 
  getAuth, 
  onAuthStateChanged, 
  signInWithCustomToken, 
  signInAnonymously 
} from 'firebase/auth';

import { AttendanceModule } from "./AttendanceModule";
import SecurityModule from "./SecurityModule";
import BroadcastModule from "./BroadcastModule";
import { LogoutButton } from "@/components/LogoutButton";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { addNotaAction, addCalificacionAction } from "@/app/actions/maestro";

// --- CONFIGURACIÓN DE FIREBASE (Inyectada o Fallback) ---
const getFirebaseConfig = () => {
    try {
        if (typeof window !== 'undefined' && (window as any).__firebase_config) {
            return JSON.parse((window as any).__firebase_config);
        }
    } catch (e) {}
    // Marcadores de posición, se espera inyección real en producción
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
const auth = getAuth(app);
const db = getFirestore(app);

export function TeacherDashboard({ 
    estudiantes, 
    maestroNombre 
}: { 
    estudiantes: any[],
    maestroNombre: string
}) {
  const [activeTab, setActiveTab] = useState<'asistencia' | 'seguridad' | 'avisos' | 'progreso'>('asistencia');
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string, visible: boolean }>({ message: "", visible: false });

  const showToast = (message: string) => {
    setToast({ message, visible: true });
    setTimeout(() => setToast({ message: "", visible: false }), 4000);
  };

  useEffect(() => {
    const initAuth = async () => {
      try {
        if (typeof (window as any).__initial_auth_token !== 'undefined' && (window as any).__initial_auth_token) {
          await signInWithCustomToken(auth, (window as any).__initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (e) { 
        console.error("Firebase Auth Error:", e); 
      }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 pb-12">
      <div className="container mx-auto max-w-6xl pt-8 px-4 sm:px-6">
        {/* Header Section - Oxford Blue Theme */}
        <header className="bg-gradient-to-r from-[#002147] to-[#001025] rounded-[32px] p-8 mb-10 text-white shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
            <div className="flex items-center gap-5 z-10">
                <div className="bg-white p-2 rounded-2xl shadow-lg border-2 border-white">
                    <img
                        src="https://informativolatelefonica.com/wp-content/uploads/2026/03/LOGO.png"
                        alt="Logo Sagrada Familia"
                        className="h-16 w-16 object-contain"
                    />
                </div>
                <div>
                    <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white drop-shadow-lg flex items-center gap-3 italic">
                        Panel del Maestro 🎓
                    </h1>
                    <p className="text-blue-100/70 mt-1 font-bold text-sm uppercase tracking-wider">
                        {maestroNombre} • Sagrada Familia
                    </p>
                </div>
            </div>

            <div className="z-10 bg-white/10 p-2 rounded-[32px] backdrop-blur-md border border-white/10">
                <LogoutButton />
            </div>

            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-20 -mt-20"></div>
        </header>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-2 mb-8 bg-white p-2 rounded-2xl shadow-sm border border-slate-100 max-w-fit mx-auto overflow-x-auto no-scrollbar">
            <button onClick={() => setActiveTab("asistencia")} className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold uppercase tracking-wider text-[10px] transition-all whitespace-nowrap ${activeTab === 'asistencia' ? 'bg-[#002147] text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}>
                <ClipboardList size={14} /> Asistencia
            </button>
            <button onClick={() => setActiveTab("seguridad")} className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold uppercase tracking-wider text-[10px] transition-all whitespace-nowrap ${activeTab === 'seguridad' ? 'bg-[#002147] text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}>
                <ShieldCheck size={14} /> Seguridad
            </button>
            <button onClick={() => setActiveTab("avisos")} className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold uppercase tracking-wider text-[10px] transition-all whitespace-nowrap ${activeTab === 'avisos' ? 'bg-[#002147] text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}>
                <Megaphone size={14} /> Avisos (Hilos)
            </button>
            <button onClick={() => setActiveTab("progreso")} className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold uppercase tracking-wider text-[10px] transition-all whitespace-nowrap ${activeTab === 'progreso' ? 'bg-[#002147] text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}>
                <UserCheck size={14} /> Progreso
            </button>
        </div>

        {/* Component Rendering */}
        <div className="max-w-4xl mx-auto">
            <Card className="rounded-[40px] border-0 shadow-2xl bg-white overflow-hidden">
                <div className="h-2 bg-[#002147]" />
                <CardContent className="p-8">
                    {activeTab === 'asistencia' && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                           <AttendanceModule />
                        </div>
                    )}

                    {activeTab === 'seguridad' && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                           <SecurityModule estudiantes={estudiantes} />
                        </div>
                    )}

                    {activeTab === 'avisos' && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                           <BroadcastModule estudiantes={estudiantes} curso="Kínder A" />
                        </div>
                    )}

                    {activeTab === 'progreso' && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                           <div className="text-center p-12 bg-slate-50 rounded-[32px] border-2 border-dashed border-slate-200">
                                <p className="text-slate-500 font-bold mb-4">Esta sección está siendo sincronizada con Supabase para reportes históricos.</p>
                                <p className="text-xs text-slate-400">Las evaluaciones académicas se mantienen en el panel tradicional temporalmente.</p>
                           </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
      </div>

      {/* --- TOAST CONFIRMACIÓN --- */}
      {toast.visible && (
          <div className="fixed bottom-6 right-6 bg-[#002147] text-white font-extrabold px-8 py-5 rounded-[24px] shadow-2xl flex items-center gap-4 animate-in slide-in-from-bottom-5 duration-300 z-50">
              <span className="bg-white/20 p-2 rounded-full">✅</span>
              {toast.message}
          </div>
      )}
    </div>
  );
}
