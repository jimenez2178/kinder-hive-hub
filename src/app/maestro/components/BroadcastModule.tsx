"use client";

import React, { useState } from 'react';
import { 
    Megaphone, 
    Send, 
    AlertTriangle,
    CheckCircle2,
    Loader2
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { notifyParent } from "@/lib/notifications";
import { createClient } from "@/utils/supabase/client";

export default function BroadcastModule({ estudiantes, curso }: { estudiantes: any[], curso: string }) {
    const [mensaje, setMensaje] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [resultado, setResultado] = useState<{ success?: boolean; count?: number; error?: string } | null>(null);
    const supabase = createClient();

    const handleSend = async () => {
        if (!mensaje.trim()) return;
        if (!confirm(`¿Estás segura de que deseas enviar este mensaje a TODOS los padres del curso ${curso}?`)) return;

        setIsLoading(true);
        setResultado(null);
        let count = 0;
        
        try {
            // Buscamos a todos los padres vinculados a los alumnos de este curso
            for (const student of estudiantes) {
                const { data: parentProfile } = await supabase
                    .from("perfiles")
                    .select("telegram_chat_id, nombre, hijo_nombre")
                    .filter('hijo_nombre', 'ilike', `%${student.nombre}%`)
                    .not("telegram_chat_id", "is", null)
                    .maybeSingle();

                if (parentProfile?.telegram_chat_id) {
                    await notifyParent(`Aviso ${curso}`, mensaje, {
                        hijo_nombre: student.nombre,
                        telegram_chat_id: parentProfile.telegram_chat_id
                    });
                    count++;
                }
            }
            
            setResultado({ success: true, count });
            setMensaje("");
        } catch (err) {
            console.error(err);
            setResultado({ error: "Ocurrió un error al enviar algunas notificaciones." });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="bg-[#002147] border-2 border-slate-700/10 p-6 rounded-[32px] text-white overflow-hidden relative shadow-lg">
                <div className="relative z-10 flex items-center gap-4">
                    <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-md">
                        <Megaphone className="h-6 w-6 text-white" />
                    </div>
                    <div>
                        <h3 className="font-extrabold text-lg italic tracking-tight uppercase">Comunicados del Maestro</h3>
                        <p className="text-blue-100/60 text-[10px] font-bold uppercase tracking-widest">Exclusivo para {curso}</p>
                    </div>
                </div>
                <div className="absolute -right-8 -top-8 w-24 h-24 bg-white/5 rounded-full blur-3xl"></div>
            </div>

            <Card className="rounded-[40px] border-0 shadow-2xl bg-white">
                <CardContent className="p-8">
                    <div className="space-y-6">
                        <div className="bg-blue-50 border-2 border-blue-100 rounded-3xl p-5 flex items-start gap-4">
                            <AlertTriangle className="h-6 w-6 text-blue-500 shrink-0 mt-1" />
                            <div>
                                <p className="text-blue-900 font-bold text-sm">Información Directa</p>
                                <p className="text-blue-800/80 text-xs font-medium leading-relaxed">
                                    Este aviso llegará instantáneamente al Telegram de los padres de tu curso. Úsalo para recordatorios de tareas, eventos o noticias importantes.
                                </p>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <label className="text-xs font-black uppercase text-slate-400 tracking-widest ml-2">Mensaje del Aviso</label>
                            <textarea 
                                placeholder={`Ej: Mañana no olviden traer su cuaderno de arte...`}
                                className="w-full min-h-[150px] rounded-[32px] border-2 border-slate-100 bg-slate-50 p-6 font-bold text-slate-800 focus:border-[#002147] focus:bg-white transition-all resize-none shadow-inner outline-none"
                                value={mensaje}
                                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setMensaje(e.target.value)}
                            />
                        </div>

                        <Button 
                            onClick={handleSend}
                            disabled={isLoading || !mensaje.trim()}
                            className="w-full h-16 rounded-[32px] bg-[#002147] hover:bg-slate-800 text-white font-black text-lg uppercase tracking-tighter shadow-xl active:scale-95 transition-all group"
                        >
                            {isLoading ? (
                                <Loader2 className="h-6 w-6 animate-spin mr-2" />
                            ) : (
                                <>
                                    <Send className="h-5 w-5 mr-3 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                                    Difundir en {curso}
                                </>
                            )}
                        </Button>

                        {resultado?.success && (
                            <div className="bg-emerald-50 border-2 border-emerald-100 rounded-3xl p-5 flex items-center gap-4 animate-in fade-in slide-in-from-bottom-2">
                                <CheckCircle2 className="h-6 w-6 text-emerald-500" />
                                <p className="text-emerald-900 font-bold text-sm">
                                    ¡Mensaje enviado a {resultado.count} padres del curso! 📢
                                </p>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
