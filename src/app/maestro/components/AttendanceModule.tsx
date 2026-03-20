"use client";

import React, { useState, useEffect } from 'react';
import { CheckCircle2, XCircle, Clock, User, Search, Save, Bell, Filter } from 'lucide-react';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, collection, doc, setDoc, getDocs } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { createClient } from "@/utils/supabase/client";
import { notifyParent } from "@/lib/notifications";

// --- CONFIGURACIÓN DE FIREBASE ---
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
const appId = typeof window !== 'undefined' && (window as any).__app_id ? (window as any).__app_id : 'kinder-hive-hub';

export function AttendanceModule() {
  const [students, setStudents] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [saving, setSaving] = useState(false);
  const [course, setCourse] = useState('Kínder A');
  const supabase = createClient();

  // 1. Cargar alumnos del curso
  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const studentsRef = collection(db, 'artifacts', appId, 'public', 'data', 'alumnos');
        const querySnapshot = await getDocs(studentsRef);
        const docs = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setStudents(docs);
        
        // Inicializar asistencia como "Presente" por defecto
        const initialAttendance: Record<string, string> = {};
        docs.forEach(s => {
          initialAttendance[s.id] = 'presente';
        });
        setAttendance(initialAttendance);
      } catch (error) {
        console.error("Error cargando alumnos:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStudents();
  }, []);

  const toggleAttendance = (studentId: string, status: string) => {
    setAttendance(prev => ({
      ...prev,
      [studentId]: status
    }));
  };

  const saveAttendance = async () => {
    setSaving(true);
    const today = new Date().toISOString().split('T')[0];
    
    try {
      // Guardar registro diario
      const attendanceRef = doc(db, 'artifacts', appId, 'public', 'data', 'asistencia', `${course}_${today}`);
      await setDoc(attendanceRef, {
        fecha: today,
        curso: course,
        registros: attendance,
        timestamp: new Date().toISOString(),
        maestra_id: auth.currentUser?.uid || 'maestra_anonima'
      });
      
      // Enviar notificaciones a padres (Telegram) para Ausentes y Tardanzas
      const ausentesOTardanzas = Object.entries(attendance).filter(([_, status]) => status === 'ausente' || status === 'tardanza');
      
      for (const [studentId, status] of ausentesOTardanzas) {
        const student = students.find(s => s.id === studentId);
        if (student) {
          // Buscamos el perfil del padre en Supabase para obtener su telegram_chat_id
          // Asumimos que podemos buscar por nombre_alumno o vinculación previa
          const { data: parentProfile } = await supabase
            .from("perfiles")
            .select("telegram_chat_id, nombre")
            .eq("nombre_alumno", student.nombre)
            .not("telegram_chat_id", "is", null)
            .maybeSingle();

          if (parentProfile?.telegram_chat_id) {
            const mensaje = status === 'ausente' 
              ? `Hola ${parentProfile.nombre}, te informamos que ${student.nombre} no asistió a clases hoy.`
              : `Hola ${parentProfile.nombre}, te informamos que ${student.nombre} llegó con tardanza hoy.`;
            
            await notifyParent(status === 'ausente' ? "Asistencia" : "Tardanza", mensaje, {
              hijo_nombre: student.nombre,
              telegram_chat_id: parentProfile.telegram_chat_id
            });
          }
        }
      }

      alert("¡Pase de lista guardado con éxito! Se han enviado los avisos a los padres vía Telegram.");
    } catch (error) {
      console.error(error);
      alert("Error al guardar la asistencia.");
    } finally {
      setSaving(false);
    }
  };

  const filteredStudents = students.filter(s => 
    s.nombre?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="bg-slate-50 min-h-[600px] rounded-[40px] overflow-hidden relative pb-20">
      {/* Header Premium Interno */}
      <div className="bg-[#002147] text-white p-8 rounded-b-[40px] shadow-xl mb-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-black tracking-tight">Pase de Lista</h1>
            <p className="text-blue-100 text-xs font-bold opacity-80 uppercase tracking-widest">
              {new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
          </div>
          <div className="bg-white/10 p-3 rounded-2xl backdrop-blur-md border border-white/10">
            <Filter size={20} />
          </div>
        </div>

        <div className="relative">
          <Search className="absolute left-4 top-3.5 text-blue-300" size={20} />
          <input 
            type="text" 
            placeholder="Buscar alumno..."
            className="w-full bg-white/10 border border-white/20 rounded-2xl py-3 pl-12 pr-4 text-white placeholder:text-blue-200 focus:outline-none focus:ring-2 focus:ring-white/30 font-bold"
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="px-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="font-black text-[#002147] text-lg tracking-tight">Alumnos ({filteredStudents.length})</h2>
          <span className="text-[10px] bg-blue-100 text-[#002147] px-3 py-1 rounded-full font-black uppercase tracking-wider border border-blue-200">{course}</span>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4 text-slate-400">
            <div className="w-10 h-10 border-4 border-[#002147] border-t-transparent rounded-full animate-spin"></div>
            <p className="font-bold text-sm">Cargando lista escolar...</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredStudents.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-[32px] border-2 border-dashed border-slate-100">
                    <User size={48} className="mx-auto text-slate-100 mb-4" />
                    <p className="text-slate-400 font-bold italic">No hay alumnos en esta lista.</p>
                </div>
            ) : filteredStudents.map((student) => (
              <div key={student.id} className="bg-white p-4 rounded-[30px] shadow-sm border border-slate-50 flex items-center justify-between transition-all hover:shadow-md">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center overflow-hidden border border-slate-100 shadow-inner">
                    {student.foto_url ? (
                      <img src={student.foto_url} alt={student.nombre} className="w-full h-full object-cover" />
                    ) : (
                      <User className="text-slate-300" size={24} />
                    )}
                  </div>
                  <div>
                    <h3 className="font-black text-[#002147] leading-tight tracking-tight">{student.nombre}</h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">{student.apellido || 'Estudiante'}</p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button 
                    onClick={() => toggleAttendance(student.id, 'presente')}
                    className={`p-3 rounded-2xl transition-all active:scale-90 ${attendance[student.id] === 'presente' ? 'bg-[#10B981] text-white shadow-lg shadow-emerald-100' : 'bg-slate-50 text-slate-300 hover:text-emerald-400'}`}
                  >
                    <CheckCircle2 size={20} />
                  </button>
                  <button 
                    onClick={() => toggleAttendance(student.id, 'tardanza')}
                    className={`p-3 rounded-2xl transition-all active:scale-90 ${attendance[student.id] === 'tardanza' ? 'bg-amber-500 text-white shadow-lg shadow-amber-100' : 'bg-slate-50 text-slate-300 hover:text-amber-400'}`}
                  >
                    <Clock size={20} />
                  </button>
                  <button 
                    onClick={() => toggleAttendance(student.id, 'ausente')}
                    className={`p-3 rounded-2xl transition-all active:scale-90 ${attendance[student.id] === 'ausente' ? 'bg-rose-500 text-white shadow-lg shadow-rose-100' : 'bg-slate-50 text-slate-300 hover:text-rose-400'}`}
                  >
                    <XCircle size={20} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="absolute bottom-6 left-0 right-0 px-6">
        <button 
          onClick={saveAttendance}
          disabled={saving || loading}
          className="w-full bg-[#002147] text-white py-5 rounded-[28px] font-black shadow-2xl shadow-blue-900/40 flex items-center justify-center gap-3 active:scale-95 transition-all disabled:opacity-50 uppercase tracking-widest text-sm"
        >
          {saving ? 'Guardando...' : 'Finalizar Pase de Lista'}
          {!saving && <Save size={20} />}
        </button>
      </div>
    </div>
  );
}
