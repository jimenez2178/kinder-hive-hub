"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { 
  CheckCircle2, 
  Clock, 
  XCircle, 
  User, 
  Search, 
  Save, 
  Calendar,
  ClipboardList,
  ShieldCheck,
  Megaphone,
  UserCheck,
  Loader2,
  LogOut
} from 'lucide-react';
import { initializeApp, getApps } from 'firebase/app';
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
  signInAnonymously,
  signOut
} from 'firebase/auth';

// --- CONFIGURACIÓN DE INFRAESTRUCTURA ---
const getFirebaseConfig = () => {
  try {
    // @ts-ignore
    return JSON.parse(typeof __firebase_config !== 'undefined' ? __firebase_config : '{}');
  } catch (e) {
    return {
        apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
        authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
        messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
        appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
    };
  }
};

const firebaseConfig = getFirebaseConfig();
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const auth = getAuth(app);
const db = getFirestore(app);
// @ts-ignore
const appId = typeof __app_id !== 'undefined' ? __app_id : 'kinder-hive-hub';
const N8N_WEBHOOK = "https://curso-n8n-n8n.sjia2i.easypanel.host/webhook/alertas-kinder";

export default function CompactTeacherDashboard({ maestroNombre }: { maestroNombre?: string }) {
  const [activeTab, setActiveTab] = useState('asistencia');
  const [user, setUser] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<Record<string, string>>({});
  const [deliveries, setDeliveries] = useState<Record<string, string>>({});
  const [broadcastMsg, setBroadcastMsg] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const course = 'Kínder A';

  useEffect(() => {
    const initAuth = async () => {
      try {
        // @ts-ignore
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
           // @ts-ignore
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (error) {
        console.error("Error en Auth:", error);
      }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  const fetchStudents = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const studentsRef = collection(db, 'artifacts', appId, 'public', 'data', 'alumnos');
      const querySnapshot = await getDocs(studentsRef);
      const docs = querySnapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      
      setStudents(docs);
      const initialAtt: Record<string, string> = {};
      const initialDel: Record<string, string> = {};
      docs.forEach((s: any) => {
        initialAtt[s.id] = 'presente';
        initialDel[s.id] = s.autorizados?.[0] || 'Padre/Madre';
      });
      setAttendance(initialAtt);
      setDeliveries(initialDel);
    } catch (error) {
      console.error("Error cargando alumnos:", error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  const triggerTelegramAlert = async (student: any, tipo: string, mensaje: string) => {
    if (!student.telegram_chat_id) return;
    try {
      await fetch(N8N_WEBHOOK, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tipo_evento: tipo.toUpperCase(),
          nombre_alumno: student.nombre,
          mensaje,
          telegram_chat_id: String(student.telegram_chat_id)
        })
      });
    } catch (error) {
      console.error("Error n8n:", error);
    }
  };

  const handleSaveAttendance = async () => {
    setSaving(true);
    const today = new Date().toISOString().split('T')[0];
    try {
      const attendanceRef = doc(db, 'artifacts', appId, 'public', 'data', 'asistencia', `${course}_${today}`);
      await setDoc(attendanceRef, {
        fecha: today,
        curso: course,
        registros: attendance,
        timestamp: new Date().toISOString(),
        maestra_uid: user.uid
      });

      for (const student of students) {
        const status = attendance[student.id];
        if (status !== 'presente') {
          const msg = status === 'ausente' ? "El alumno no se ha reportado en clase hoy." : "Se ha registrado una llegada con tardanza.";
          await triggerTelegramAlert(student, status, msg);
        }
      }
      alert("✓ Pase de lista guardado.");
    } catch (error) {
      alert("Error al guardar.");
    } finally {
      setSaving(false);
    }
  };

  const filteredStudents = students.filter(s => 
    s.nombre?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50 pb-32 font-sans text-slate-900 w-full">
      <header className="bg-indigo-900 text-white p-6 rounded-b-[3.5rem] shadow-2xl sticky top-0 z-50">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <div className="bg-white/10 p-2.5 rounded-2xl backdrop-blur-md">
              <Calendar size={20} className="text-indigo-200" />
            </div>
            <div>
                <h1 className="text-xl font-bold tracking-tight">Kinder Hive Hub</h1>
                <p className="text-[10px] text-indigo-200 font-bold uppercase">{maestroNombre || "Panel Maestro"}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-3 py-1 rounded-full font-bold uppercase">
                {course}
            </span>
            <button onClick={() => signOut(auth)} className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors">
                <LogOut size={16} />
            </button>
          </div>
        </div>
        <div className="flex bg-black/20 p-1.5 rounded-2xl gap-1">
          {[{id:'asistencia', label:'Asistencia', icon:<ClipboardList size={16}/>}, 
            {id:'seguridad', label:'Seguridad', icon:<ShieldCheck size={16}/>}, 
            {id:'avisos', label:'Avisos', icon:<Megaphone size={16}/>}].map(tab => (
            <button 
                key={tab.id} 
                onClick={() => setActiveTab(tab.id)} 
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[11px] font-bold transition-all ${activeTab === tab.id ? 'bg-white text-indigo-900' : 'text-indigo-100/60'}`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>
      </header>

      <main className="p-6 max-w-lg mx-auto">
        {activeTab !== 'avisos' && (
          <div className="relative mb-8">
            <Search className="absolute left-4 top-4 text-slate-400" size={18} />
            <input 
                type="text" 
                placeholder="Buscar alumno..." 
                className="w-full bg-white border-none ring-1 ring-slate-200 rounded-2xl py-4 pl-12 shadow-sm focus:ring-2 focus:ring-indigo-500" 
                onChange={(e) => setSearchTerm(e.target.value)} 
            />
          </div>
        )}

        {loading ? (
          <div className="py-24 text-center space-y-4">
            <Loader2 className="animate-spin text-indigo-600 mx-auto" size={40} />
            <p className="text-slate-400 font-medium italic">Sincronizando...</p>
          </div>
        ) : activeTab === 'asistencia' ? (
          <div className="space-y-4">
            {filteredStudents.map(student => (
              <div key={student.id} className="bg-white p-4 rounded-[2rem] shadow-sm border border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300 border border-slate-100"><User size={24}/></div>
                  <div>
                    <h3 className="font-bold text-slate-800 text-sm">{student.nombre}</h3>
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">{student.telegram_chat_id ? 'Telegram Activo' : 'Sin Vínculo'}</span>
                  </div>
                </div>
                <div className="flex gap-1">
                  {[{id:'presente', icon:<CheckCircle2 size={18}/>, color:'bg-emerald-500'}, {id:'tardanza', icon:<Clock size={18}/>, color:'bg-amber-500'}, {id:'ausente', icon:<XCircle size={18}/>, color:'bg-rose-500'}].map(btn => (
                    <button 
                        key={btn.id} 
                        onClick={() => setAttendance({...attendance, [student.id]: btn.id})} 
                        className={`p-3 rounded-xl ${attendance[student.id] === btn.id ? `${btn.color} text-white` : 'bg-slate-50 text-slate-300'}`}
                    >
                        {btn.icon}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : activeTab === 'seguridad' ? (
          <div className="space-y-6">
            {filteredStudents.map(student => (
              <div key={student.id} className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 space-y-4">
                <h3 className="font-bold text-slate-800">{student.nombre}</h3>
                <select 
                    className="w-full bg-slate-50 rounded-xl py-4 px-4 text-sm font-bold border-none ring-1 ring-slate-200" 
                    value={deliveries[student.id]} 
                    onChange={(e) => setDeliveries({...deliveries, [student.id]: e.target.value})}
                >
                  {student.autorizados?.map((p: any) => <option key={p} value={p}>{p}</option>) || <option value="Padre/Madre">Padre/Madre</option>}
                </select>
                <button 
                    onClick={async () => {
                        const confirmMsg = `¿Confirmar salida de ${student.nombre} con ${deliveries[student.id]}?`;
                        if (confirm(confirmMsg)) {
                            await triggerTelegramAlert(student, 'SEGURIDAD', `Se ha confirmado la salida con ${deliveries[student.id]}.`);
                            alert("Confirmado.");
                        }
                    }} 
                    className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold shadow-xl"
                >
                    Confirmar Salida
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white p-10 rounded-[3rem] shadow-2xl border border-slate-100 space-y-8">
            <textarea 
                className="w-full bg-slate-50 rounded-[3rem] p-6 h-56 focus:ring-2 focus:ring-indigo-500 text-sm" 
                placeholder="Mensaje masivo..." 
                value={broadcastMsg} 
                onChange={(e) => setBroadcastMsg(e.target.value)} 
            />
            <button 
                onClick={async () => {
                    const confirmMsg = `¿Enviar circular a todos los alumnos de ${course}?`;
                    if (confirm(confirmMsg)) {
                        setSaving(true);
                        for (const student of students) {
                            if (student.telegram_chat_id) {
                                await triggerTelegramAlert(student, 'CIRCULAR', broadcastMsg);
                            }
                        }
                        setSaving(false);
                        alert("✓ Mensajes enviados.");
                        setBroadcastMsg('');
                    }
                }} 
                className="w-full bg-slate-900 text-white py-5 rounded-[2rem] font-bold"
            >
                {saving ? 'Enviando...' : 'Enviar Circular'}
            </button>
          </div>
        )}
      </main>

      {activeTab === 'asistencia' && !loading && (
        <div className="fixed bottom-10 left-0 right-0 px-8">
          <button 
            onClick={handleSaveAttendance} 
            disabled={saving || !user} 
            className="w-full bg-slate-900 text-white py-6 rounded-[2.5rem] font-bold shadow-2xl flex items-center justify-center gap-4"
          >
            {saving ? <Loader2 className="animate-spin" size={24}/> : <Save size={24}/>}
            <span>{saving ? 'Procesando...' : 'Finalizar y Notificar'}</span>
          </button>
        </div>
      )}
    </div>
  );
}
