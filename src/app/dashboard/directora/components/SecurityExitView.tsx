"use client";

import React, { useState, useEffect } from "react";
import { 
    ShieldCheck, 
    Search, 
    User, 
    IdCard, 
    UserCheck,
    Loader2,
    ArrowRight,
    CheckCircle2,
    Trash2,
    XCircle
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getAuthorizedByStudentAction, deleteAuthorizedAction } from "@/app/actions/autorizaciones";
import { recordExitAction } from "@/app/actions/directora";

interface SecurityExitViewProps {
    estudiantes: any[];
}

export default function SecurityExitView({ estudiantes }: SecurityExitViewProps) {
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedAlumno, setSelectedAlumno] = useState<any | null>(null);
    const [authorizedList, setAuthorizedList] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isActionLoading, setIsActionLoading] = useState<string | null>(null);

    const filteredEstudiantes = estudiantes.filter(est => 
        est.nombre.toLowerCase().includes(searchTerm.toLowerCase())
    );

    useEffect(() => {
        if (selectedAlumno) {
            loadAuthorized(selectedAlumno.id);
        }
    }, [selectedAlumno]);

    async function loadAuthorized(alumnoId: string) {
        setIsLoading(true);
        const res = await getAuthorizedByStudentAction(alumnoId);
        if (res.data) setAuthorizedList(res.data);
        else setAuthorizedList([]);
        setIsLoading(false);
    }

    const handleDelivery = async (auth: any, isFinalDelivery = true) => {
        const confirmMsg = isFinalDelivery 
            ? `¿Confirmas que el alumno ${selectedAlumno.nombre} ha sido entregado a ${auth.nombre_sustituto}?`
            : `¿Seguro que deseas eliminar esta autorización de ${auth.nombre_sustituto}?`;

        if (!confirm(confirmMsg)) return;
        
        setIsActionLoading(auth.id);
        
        try {
            if (isFinalDelivery) {
                // Registro interno en tabla asistencia
                const exitRes = await recordExitAction(selectedAlumno.id);
                if (exitRes.error) {
                    console.error("No se pudo registrar en asistencia, procediendo con borrado:", exitRes.error);
                }
            }

            // Eliminar autorización (Limpieza del panel)
            const pathParts = auth.foto_url.split('/autorizaciones/').pop()?.split('?')[0];
            const res = await deleteAuthorizedAction(auth.id, pathParts);
            
            if (res.error) {
                alert(res.error);
            } else {
                if (isFinalDelivery) {
                    alert("¡Estudiante entregado con éxito!");
                }
                loadAuthorized(selectedAlumno.id);
            }
        } catch (err) {
            console.error(err);
            alert("Error procesando la entrega.");
        } finally {
            setIsActionLoading(null);
        }
    };

    return (
        <div className="flex flex-col h-full max-h-[90vh]">
            {/* Header y Buscador */}
            <div className="flex flex-col gap-4 mb-4 px-1">
                <div className="flex justify-between items-center">
                    <div>
                        <h3 className="text-2xl md:text-3xl font-black text-slate-900 italic uppercase tracking-tighter flex items-center gap-2">
                            <ShieldCheck className="h-6 w-6 md:h-8 md:w-8 text-[#10B981]" />
                            Seguridad de Salida
                        </h3>
                        <p className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-widest mt-0.5">Control de Sustitutos</p>
                    </div>
                </div>

                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                    <Input 
                        placeholder="Buscar alumno..." 
                        className="h-12 md:h-16 pl-11 pr-6 rounded-2xl md:rounded-3xl border-2 border-slate-100 shadow-sm font-bold text-sm md:text-lg focus:border-[#002147] transition-all bg-white"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Layout Principal */}
            <div className="flex-1 min-h-0 flex flex-col lg:flex-row gap-4">
                
                {/* Listado de Alumnos - Scroll Horizontal en Móvil */}
                <div className="flex lg:flex-col lg:w-72 overflow-x-auto lg:overflow-y-auto gap-2 pb-2 lg:pb-0 lg:pr-2 custom-scrollbar shrink-0">
                    {filteredEstudiantes.map((est) => (
                        <button
                            key={est.id} 
                            onClick={() => setSelectedAlumno(est)}
                            className={`p-3 md:p-4 rounded-xl md:rounded-2xl transition-all border-2 flex items-center gap-3 text-left shrink-0 min-w-[140px] lg:min-w-0 ${
                                selectedAlumno?.id === est.id 
                                ? 'bg-[#002147] border-[#002147] text-white shadow-lg' 
                                : 'bg-white border-slate-100 text-slate-700 hover:border-slate-300'
                            }`}
                        >
                            <div className={`h-8 w-8 shrink-0 rounded-lg flex items-center justify-center font-black text-xs ${
                                selectedAlumno?.id === est.id ? 'bg-white/20' : 'bg-slate-100'
                            }`}>
                                {est.nombre.charAt(0)}
                            </div>
                            <div className="min-w-0">
                                <p className="font-extrabold uppercase text-[10px] md:text-[11px] leading-tight truncate">{est.nombre}</p>
                                <p className={`text-[8px] md:text-[9px] font-bold uppercase tracking-widest truncate ${
                                    selectedAlumno?.id === est.id ? 'text-white/60' : 'text-slate-400'
                                }`}>
                                    {est.grado}
                                </p>
                            </div>
                        </button>
                    ))}
                </div>

                {/* Detalle de Autorizados */}
                <div className="flex-1 bg-slate-50 rounded-[24px] md:rounded-[32px] p-4 md:p-6 border-2 border-slate-100 flex flex-col overflow-y-auto custom-scrollbar">
                    {selectedAlumno ? (
                        <>
                            <div className="flex items-center justify-between mb-4">
                                <div className="min-w-0">
                                    <Badge className="bg-emerald-100 text-emerald-700 border-none font-black text-[8px] uppercase mb-1">
                                        Autorizados Verificados
                                    </Badge>
                                    <h4 className="text-lg md:text-xl font-black text-slate-800 uppercase italic tracking-tighter truncate leading-tight">
                                        {selectedAlumno.nombre}
                                    </h4>
                                </div>
                                <UserCheck className="h-6 w-6 md:h-8 md:w-8 text-[#10B981] opacity-20 shrink-0" />
                            </div>

                            {isLoading ? (
                                <div className="flex-1 flex items-center justify-center">
                                    <Loader2 className="h-8 w-8 animate-spin text-slate-300" />
                                </div>
                            ) : authorizedList.length > 0 ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {authorizedList.map((auth) => (
                                        <Card key={auth.id} className="rounded-3xl overflow-hidden border-0 shadow-md bg-white flex flex-col h-full min-w-0">
                                            {/* Imagen: Controlamos el ancho para que no se squeeze */}
                                            <div className="relative aspect-[4/5] w-full overflow-hidden bg-slate-200 shrink-0">
                                                {auth.foto_url ? (
                                                    <img 
                                                        src={auth.foto_url} 
                                                        alt={auth.nombre_sustituto} 
                                                        referrerPolicy="no-referrer"
                                                        className="w-full h-full object-cover" 
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-slate-400">
                                                        <User className="h-12 w-12" />
                                                    </div>
                                                )}
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent text-white p-4 flex flex-col justify-end">
                                                    <span className="text-[8px] font-black uppercase tracking-tighter text-emerald-400 mb-0.5">{auth.parentesco}</span>
                                                    <h5 className="font-black text-base md:text-lg uppercase italic tracking-tighter leading-tight truncate">{auth.nombre_sustituto}</h5>
                                                </div>
                                            </div>
                                            
                                            <div className="p-4 flex flex-col gap-3">
                                                <div className="flex items-center gap-2 text-slate-500">
                                                    <IdCard className="h-4 w-4 shrink-0" />
                                                    <span className="font-bold text-[10px] md:text-xs truncate">{auth.cedula}</span>
                                                </div>
                                                
                                                <div className="flex gap-2">
                                                    <Button 
                                                        onClick={() => handleDelivery(auth, true)}
                                                        disabled={!!isActionLoading}
                                                        className="flex-1 h-10 md:h-12 rounded-xl bg-[#10B981] hover:bg-emerald-600 text-white font-black text-[10px] uppercase shadow-md active:scale-95 transition-all"
                                                    >
                                                        {isActionLoading === auth.id ? (
                                                            <Loader2 className="h-4 w-4 animate-spin" />
                                                        ) : (
                                                            "Entregado ✅"
                                                        )}
                                                    </Button>
                                                    <Button 
                                                        onClick={() => handleDelivery(auth, false)}
                                                        variant="ghost"
                                                        disabled={!!isActionLoading}
                                                        className="w-10 h-10 md:w-12 md:h-12 rounded-xl border-2 border-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-all shrink-0"
                                                    >
                                                        <Trash2 className="h-5 w-5" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </Card>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex-1 flex flex-col items-center justify-center text-center p-6 bg-white/50 rounded-3xl border-2 border-dashed border-slate-200">
                                    <XCircle className="h-10 w-10 text-slate-200 mb-2" />
                                    <p className="font-black text-slate-400 uppercase text-[10px] tracking-widest">Sin Autorizados</p>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-center p-8 space-y-4">
                            <div className="bg-white p-6 rounded-[32px] shadow-sm">
                                <Search className="h-10 w-10 text-slate-100" />
                            </div>
                            <p className="text-xs font-black text-slate-300 uppercase tracking-widest italic">Selecciona un alumno para verificar</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
