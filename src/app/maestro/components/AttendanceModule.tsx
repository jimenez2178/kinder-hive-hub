"use client";

import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  User, 
  Search, 
  Save, 
  Bell, 
  Filter,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDocs 
} from 'firebase/firestore';
import { 
  getAuth, 
  onAuthStateChanged, 
  signInAnonymously,
  signInWithCustomToken 
} from 'firebase/auth';
import { createClient } from "@/utils/supabase/client";
import { notifyParent } from "@/lib/notifications";

// --- CONFIGURACIÓN DE INFRAESTRUCTURA FIREBASE ---
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

// Función de Normalización para filtros robustos
const normalize = (str: string) => 
  str ? str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim() : "";

export function AttendanceModule() {
  const [user, setUser] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [saving, setSaving] = useState(false);
  const [course, setCourse] = useState('Kínder A');
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  // 1. Sincronización de Autenticación (Sección 3 del Plan de Auditoría)
  useEffect(() => {
    const initAuth = async () => {
      console.log("🛠️ Audit: Iniciando Auth para appId:", appId);
      try {
        if (typeof (window as any).__initial_auth_token !== 'undefined' && (window as any).__initial_auth_token) {
          await signInWithCustomToken(auth, (window as any).__initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (err) {
        console.error("❌ Error de Auth Firebase:", err);
        setError("Error de conexión con el servidor de seguridad.");
      }
    };

    initAuth();
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  // 2. Carga de Alumnos con Filtro Robusto (Sección 1 y 2 del Plan)
  useEffect(() => {
    if (!user) return; // Esperar a que el usuario esté autenticado para evitar bloqueos por reglas

    const fetchStudents = async () => {
      setLoading(true);
      setError(null);
      try {
        const path = `artifacts/${appId}/public/data/alumnos`;
        console.log("📂 Audit: Consultando ruta Firestore ->", path);
        
        const studentsRef = collection(db, 'artifacts', appId, 'public', 'data', 'alumnos');
        const querySnapshot = await getDocs(studentsRef);
        
        const allDocs = querySnapshot.docs.map(doc => ({ 
          id: doc.id, 
          ...doc.data() 
        }));

        console.log("📊 Audit: Alumnos crudos encontrados en DB:", allDocs.length);
        console.table(allDocs.map((d: any) => ({ nombre: d.nombre, curso: d.curso, grado: d.grado })));

        // Aplicar Filtrado Robusto (Normalización de tildes y mayúsculas)
        const normalizedCourse = normalize(course);
        const filtered = allDocs.filter((s: any) => {
            const studentCourse = s.curso || s.grado || "";
            return normalize(studentCourse) === normalizedCourse;
        });

        console.log(`🎯 Audit: Alumnos tras filtrar por "${course}":`, filtered.length);
        
        setStudents(filtered);
        
        // Inicializar asistencia
        const initialAttendance: Record<string, string> = {};
        filtered.forEach((s: any) => {
          initialAttendance[s.id] = 'presente';
        });
        setAttendance(initialAttendance);

      } catch (err) {
        console.error("❌ Error cargando alumnos:", err);
        setError("No se pudieron cargar los alumnos. Revisa los permisos de la base de datos.");
      } finally {
        setLoading(false);
      }
    };

    fetchStudents();
  }, [user, course]);

  const toggleAttendance = (studentId: string, status: string) => {
    setAttendance(prev => ({ ...prev, [studentId]: status }));
  };

  const saveAttendance = async () => {
    if (!user) return;
    setSaving(true);
    const today = new Date().toISOString().split('T')[0];
    
    try {
      const attendanceRef = doc(db, 'artifacts', appId, 'public', 'data', 'asistencia', `${course}_${today}`);
      await setDoc(attendanceRef, {
        fecha: today,
        curso: course,
        registros: attendance,
        timestamp: new Date().toISOString(),
        maestra_id: user.uid
      });

      // --- Notificaciones a Telegram ---
      const ausentesOTardanzas = Object.entries(attendance).filter(([_, status]) => status === 'ausente' || status === 'tardanza');
      
      for (const [studentId, status] of ausentesOTardanzas) {
        const student = students.find(s => s.id === studentId);
        if (student) {
          const { data: parentProfile } = await supabase
            .from("perfiles")
            .select("telegram_chat_id, nombre, hijo_nombre")
            .filter('hijo_nombre', 'ilike', `%${student.nombre}%`)
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

      alert("¡Pase de lista guardado con éxito! Se han enviado avisos a los padres vinculados.");
    } catch (err) {
      console.error("Error al guardar:", err);
      alert("Error al guardar la asistencia.");
    } finally {
      setSaving(false);
    }
  };

  const filteredBySearch = students.filter(s => 
    normalize(s.nombre).includes(normalize(searchTerm))
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
            <Filter size={20} className="text-blue-200" />
          </div>
        </div>

        <div className="relative">
          <Search className="absolute left-4 top-3.5 text-blue-300" size={20} />
          <input 
            type="text" 
            placeholder="Buscar por nombre..."
            className="w-full bg-white/10 border border-white/20 rounded-2xl py-3.5 pl-12 pr-4 text-white placeholder:text-blue-200 focus:outline-none focus:ring-2 focus:ring-white/30 font-bold transition-all"
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="px-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="font-black text-[#002147] text-lg tracking-tight uppercase tracking-tighter">
            Alumnos ({filteredBySearch.length})
          </h2>
          <select 
            className="bg-blue-100 text-[#002147] text-xs px-4 py-2 rounded-full font-black border-none ring-0 focus:ring-2 focus:ring-blue-300 cursor-pointer"
            value={course}
            onChange={(e) => setCourse(e.target.value)}
          >
            <option value="Kínder A">KÍNDER A</option>
            <option value="Kínder B">KÍNDER B</option>
          </select>
        </div>

        {error && (
          <div className="bg-rose-50 border-2 border-rose-100 p-4 rounded-2xl flex items-center gap-3 text-rose-600 mb-6">
            <AlertCircle size={20} />
            <p className="text-xs font-bold">{error}</p>
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4 text-slate-400">
            <Loader2 className="animate-spin text-[#002147]" size={40} />
            <p className="font-bold text-sm">Sincronizando con Kinder Hive...</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredBySearch.length === 0 && (
              <div className="text-center py-20 bg-white rounded-[32px] border-2 border-dashed border-slate-100">
                <User size={48} className="mx-auto text-slate-100 mb-4" />
                <p className="text-slate-400 font-bold italic px-10">
                  No hay alumnos registrados en <span className="text-[#002147]">{course}</span>.
                </p>
                <p className="text-[10px] text-slate-300 mt-2 uppercase font-black tracking-widest">Verifica la tilde en el perfil del alumno</p>
              </div>
            )}
            
            {filteredBySearch.map((student) => (
              <div key={student.id} className="bg-white p-4 rounded-[30px] shadow-sm border border-slate-50 flex items-center justify-between transition-all hover:shadow-md">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center border border-slate-100 shadow-inner overflow-hidden">
                    {student.foto_url ? (
                      <img src={student.foto_url} alt={student.nombre} className="w-full h-full object-cover" />
                    ) : (
                      <User className="text-slate-300" size={24} />
                    )}
                  </div>
                  <div>
                    <h3 className="font-black text-[#002147] leading-tight tracking-tight">{student.nombre}</h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{student.apellido || 'Estudiante'}</p>
                  </div>
                </div>

                <div className="flex gap-2">
                  {[
                    { id: 'presente', icon: <CheckCircle2 size={20}/>, color: 'bg-emerald-500' },
                    { id: 'tardanza', icon: <Clock size={20}/>, color: 'bg-amber-500' },
                    { id: 'ausente', icon: <XCircle size={20}/>, color: 'bg-rose-500' }
                  ].map(btn => (
                    <button 
                      key={btn.id}
                      onClick={() => toggleAttendance(student.id, btn.id)}
                      className={`p-3 rounded-2xl transition-all active:scale-90 ${attendance[student.id] === btn.id ? `${btn.color} text-white shadow-lg` : 'bg-slate-50 text-slate-300 hover:text-slate-400'}`}
                    >
                      {btn.icon}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="absolute bottom-6 left-0 right-0 px-6">
        <button 
          onClick={saveAttendance}
          disabled={saving || loading || !user}
          className="w-full bg-[#002147] text-white py-5 rounded-[28px] font-black shadow-2xl flex items-center justify-center gap-3 active:scale-95 transition-all disabled:opacity-50 uppercase tracking-widest text-sm"
        >
          {saving ? <Loader2 className="animate-spin" size={20}/> : <Save size={20} />}
          {saving ? 'Guardando...' : 'Finalizar Pase de Lista'}
        </button>
      </div>
    </div>
  );
}
