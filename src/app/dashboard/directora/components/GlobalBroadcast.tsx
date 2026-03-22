"use client";

import React, { useState } from 'react';
import { 
    Megaphone, 
    Send, 
    Users, 
    AlertTriangle,
    CheckCircle2,
    Loader2
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { sendGlobalBroadcastAction } from "@/app/actions/directora";
import { notifyParent } from "@/lib/notifications";

export default function GlobalBroadcast() {
    const [mensaje, setMensaje] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [resultado, setResultado] = useState<{ success?: boolean; count?: number; skipped?: number; error?: string } | null>(null);
    const [progress, setProgress] = useState({ current: 0, total: 0 });

    const handleSend = async () => {
        if (!mensaje.trim()) return;
        if (!confirm("¿Estás segura de que deseas enviar este mensaje a TODOS los padres con Telegram vinculado?")) return;

        setIsLoading(true);
        setResultado(null);
        
        try {
            const res = await sendGlobalBroadcastAction(mensaje);
            
            if (res.success && res.destinatarios) {
                const total = res.destinatarios.length;
                setProgress({ current: 0, total });
                
                let exitos = 0;
                for (let i = 0; i < total; i++) {
                    const dest = res.destinatarios[i];
                    setProgress(prev => ({ ...prev, current: i + 1 }));
                    
                    const notifyRes = await notifyParent("Broadcast", mensaje, {
                        hijo_nombre: "General",
                        telegram_chat_id: dest.telegram_chat_id
                    });
                    
                    if (notifyRes.success) exitos++;
                }
                
                setResultado({ 
                    success: true, 
                    count: exitos, 
                    skipped: res.skipped 
                });
                setMensaje("");
            } else if (res.error) {
                setResultado({ error: res.error });
            }
        } catch (err) {
            setResultado({ error: "Error de conexión con el servidor" });
        } finally {
            setIsLoading(false);
            setProgress({ current: 0, total: 0 });
        }
    };

    return (
        <Card className="rounded-[40px] border-0 shadow-2xl bg-white overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-[#002147] to-[#001025] p-8 text-white relative">
                <div className="relative z-10 flex items-center gap-4">
                    <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-sm">
                        <Megaphone className="h-8 w-8 text-white" />
                    </div>
                    <div>
                        <CardTitle className="text-2xl font-black italic uppercase tracking-tighter">
                            Broadcast Global 📢
                        </CardTitle>
                        <p className="text-blue-100/70 text-xs font-bold uppercase tracking-widest mt-1">
                            Avisos Directos a Telegram
                        </p>
                    </div>
                </div>
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl -mr-10 -mt-10"></div>
            </CardHeader>
            
            <CardContent className="p-8">
                <div className="space-y-6">
                    <div className="bg-amber-50 border-2 border-amber-100 rounded-3xl p-5 flex items-start gap-4">
                        <AlertTriangle className="h-6 w-6 text-amber-500 shrink-0 mt-1" />
                        <div>
                            <p className="text-amber-900 font-black text-sm uppercase tracking-tighter">Atención</p>
                            <p className="text-amber-800/80 text-xs font-medium leading-relaxed">
                                Este mensaje se enviará instantáneamente a todos los padres que tengan su ID de Telegram vinculado en el sistema. Úsalo para avisos urgentes o generales.
                            </p>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <label className="text-xs font-black uppercase text-slate-400 tracking-widest ml-2">Mensaje del Comunicado</label>
                        <Textarea 
                            placeholder="Escribe aquí el mensaje para los padres..."
                            className="min-h-[150px] rounded-[32px] border-2 border-slate-100 bg-slate-50 p-6 font-bold text-slate-800 focus:border-[#002147] focus:bg-white transition-all resize-none shadow-inner"
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
                                Enviar a todos los Padres
                            </>
                        )}
                    </Button>

                    {isLoading && progress.total > 0 && (
                        <div className="bg-blue-50 border-2 border-blue-100 rounded-3xl p-5 flex items-center gap-4 animate-pulse">
                            <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
                            <p className="text-blue-900 font-bold text-sm">
                                Enviando: {progress.current} de {progress.total} padres...
                            </p>
                        </div>
                    )}

                    {resultado?.success && (
                        <div className="bg-emerald-50 border-2 border-emerald-100 rounded-3xl p-5 flex flex-col gap-2 animate-in fade-in slide-in-from-bottom-2">
                            <div className="flex items-center gap-4">
                                <CheckCircle2 className="h-6 w-6 text-emerald-500" />
                                <p className="text-emerald-900 font-bold text-sm">
                                    ¡Broadcast completado con éxito! 🎉
                                </p>
                            </div>
                            <p className="text-xs text-emerald-700 font-medium ml-10">
                                {resultado.count} enviados correctamente. {resultado.skipped} omitidos (sin Telegram).
                            </p>
                        </div>
                    )}

                    {resultado?.error && (
                        <div className="bg-red-50 border-2 border-red-100 rounded-3xl p-5 flex items-center gap-4 animate-in fade-in slide-in-from-bottom-2">
                            <div className="bg-red-500 text-white p-1 rounded-full">
                                <AlertTriangle className="h-4 w-4" />
                            </div>
                            <p className="text-red-900 font-bold text-sm">
                                Error: {resultado.error}
                            </p>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
