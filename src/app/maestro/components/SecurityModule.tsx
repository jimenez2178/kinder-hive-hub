"use client";

import React, { useState } from 'react';
import { 
    ShieldCheck, 
    UserCheck, 
    Search, 
    AlertTriangle,
    CheckCircle2,
    Loader2
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { notifyParent } from "@/lib/notifications";
import { createClient } from "@/utils/supabase/client";
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, doc, setDoc } from 'firebase/firestore';

// --- CONFIGURACIÓN DE FIREBASE (Mismo que AttendanceModule) ---
const getFirebaseConfig = () => {
    try {
        if (typeof window !== 'undefined' && (window as any).__firebase_config) {
            return JSON.parse((window as any).__firebase_config);
        }
    } catch (e) {}
    return { apiKey: "AIzaSy...", authDomain: "kinder-hive.firebaseapp.com", projectId: "kinder-hive" };
};

const app = getApps().length > 0 ? getApp() : initializeApp(getFirebaseConfig());
const db = getFirestore(app);
const appId = typeof window !== 'undefined' && (window as any).__app_id ? (window as any).__app_id : 'kinder-hive-hub';

export default function SecurityModule({ estudiantes }: { estudiantes: any[] }) {
    const [searchTerm, setSearchTerm] = useState("");
    const [deliveries, setDeliveries] = useState<Record<string, string>>({});
    const [isSaving, setIsSaving] = useState<string | null>(null);
    const supabase = createClient();

    const filteredStudents = estudiantes.filter(s => 
        s.nombre.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleDeliverStudent = async (student: any) => {
        const persona = deliveries[student.id] || "Padre/Madre";
        setIsSaving(student.id);
        
        try {
            // 1. Registro en Firebase (Log de Seguridad)
            const logId = `${student.id}_${Date.now()}`;
            const logRef = doc(db, 'artifacts', appId, 'public', 'data', 'salidas', logId);
            await setDoc(logRef, {
                alumno_id: student.id,
                alumno_nombre: student.nombre,
                retirado_por: persona,
                fecha: new Date().toISOString(),
                tipo: 'entrega_escolar'
            });

            // 2. Notificación a Telegram (vía Supabase Profile)
            const { data: parentProfile } = await supabase
                .from("perfiles")
                .select("telegram_chat_id, nombre, hijo_nombre")
                .filter('hijo_nombre', 'ilike', `%${student.nombre}%`)
                .not("telegram_chat_id", "is", null)
                .maybeSingle();

            if (parentProfile?.telegram_chat_id) {
                const now = new Date().toLocaleTimeString('es-DO', { hour: '2-digit', minute: '2-digit', hour12: true });
                const mensaje = `🔔 AVISO DE SEGURIDAD: ${student.nombre} ha sido retirado con éxito de la institución por: ${persona} a las ${now}.`;
                
                await notifyParent("Seguridad", mensaje, {
                    hijo_nombre: student.nombre,
                    telegram_chat_id: parentProfile.telegram_chat_id
                });
            }

            alert(`¡Entrega de ${student.nombre} registrada y notificada!`);
        } catch (error) {
            console.error(error);
            alert("Error al registrar salida.");
        } finally {
            setIsSaving(null);
        }
    };

    return (
        <div className="space-y-6">
            <div className="relative">
                <Search className="absolute left-4 top-3.5 text-slate-400" size={20} />
                <Input 
                    placeholder="Buscar alumno para entrega..."
                    className="h-14 rounded-2xl border-2 border-slate-100 pl-12 font-bold focus:border-[#002147] transition-all"
                    value={searchTerm}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                />
            </div>

            <div className="bg-amber-50 border-2 border-amber-100 p-5 rounded-3xl flex items-start gap-4">
                <ShieldCheck className="h-6 w-6 text-amber-500 shrink-0 mt-1" />
                <div>
                    <p className="text-amber-900 font-black text-sm uppercase tracking-tighter">Protocolo de Salida</p>
                    <p className="text-amber-800/80 text-xs font-medium leading-relaxed">
                        Selecciona quién retira al alumno para enviar la alerta de seguridad instantánea al padre/madre.
                    </p>
                </div>
            </div>

            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                {filteredStudents.map((student) => (
                    <Card key={student.id} className="rounded-[32px] border-2 border-slate-50 shadow-sm hover:border-indigo-100 transition-all">
                        <CardContent className="p-6">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 shadow-inner border border-indigo-100">
                                    <UserCheck size={28} />
                                </div>
                                <div>
                                    <h3 className="font-black text-slate-800 text-lg tracking-tight uppercase italic">{student.nombre}</h3>
                                    <p className="text-[10px] text-slate-400 font-bold tracking-widest uppercase">{student.grado}</p>
                                </div>
                            </div>
                            
                            <div className="space-y-4">
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Retirado por:</label>
                                    <select 
                                        className="w-full h-12 bg-slate-50 border-2 border-slate-100 rounded-2xl px-4 text-sm font-bold focus:border-[#002147] outline-none transition-all"
                                        value={deliveries[student.id] || ""}
                                        onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setDeliveries({...deliveries, [student.id]: e.target.value})}
                                    >
                                        <option value="Padre/Madre">Padre/Madre</option>
                                        <option value="Tutor Autorizado">Tutor Autorizado</option>
                                        <option value="Transporte Escolar">Transporte Escolar</option>
                                        <option value="Abuelo/a">Abuelo/a</option>
                                        <option value="Tío/a">Tío/a</option>
                                    </select>
                                </div>
                                <Button 
                                    onClick={() => handleDeliverStudent(student)}
                                    disabled={isSaving === student.id}
                                    className="w-full h-14 rounded-2xl bg-[#002147] hover:bg-slate-900 text-white font-black uppercase tracking-tighter shadow-lg active:scale-95 transition-all"
                                >
                                    {isSaving === student.id ? (
                                        <Loader2 className="h-5 w-5 animate-spin" />
                                    ) : (
                                        <>Confirmar Entrega SafeExit <ShieldCheck className="ml-2 h-4 w-4" /></>
                                    )}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}

                {filteredStudents.length === 0 && (
                    <div className="text-center py-20 bg-slate-50 rounded-[32px] border-2 border-dashed border-slate-200">
                        <p className="text-slate-400 font-bold italic italic">No se encontraron alumnos.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
