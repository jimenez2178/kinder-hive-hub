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
    Smartphone
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getAuthorizedByStudentAction, deleteAuthorizedAction } from "@/app/actions/autorizaciones";

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

    const handleDelivery = async (auth: any) => {
        if (!confirm(`¿Confirmas que el alumno ${selectedAlumno.nombre} ha sido entregado a ${auth.nombre_sustituto}? Esto eliminará la autorización dinámica.`)) return;
        
        setIsActionLoading(auth.id);
        
        // Notificar via WhatsApp (Simulado/Abierto)
        const message = `Hola, te informamos que ${selectedAlumno.nombre} ha sido entregado(a) correctamente a ${auth.nombre_sustituto}. ¡Gracias por usar Kinder Hive Hub!`;
        const wpUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
        window.open(wpUrl, '_blank');

        // Eliminar autorización
        const pathParts = auth.foto_url.split('/autorizaciones/').pop()?.split('?')[0];
        const res = await deleteAuthorizedAction(auth.id, pathParts);
        
        if (res.error) {
            alert(res.error);
        } else {
            loadAuthorized(selectedAlumno.id);
        }
        setIsActionLoading(null);
    };

    return (
        <div className="flex flex-col h-full max-h-[85vh]">
            {/* Header y Buscador */}
            <div className="flex flex-col gap-4 mb-6 px-2">
                <div className="flex justify-between items-center">
                    <div>
                        <h3 className="text-2xl md:text-3xl font-black text-slate-900 italic uppercase tracking-tighter flex items-center gap-2">
                            <ShieldCheck className="h-6 w-6 md:h-8 md:h-8 text-[#10B981]" />
                            Seguridad de Salida
                        </h3>
                        <p className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-widest mt-0.5">Verificación en tiempo real</p>
                    </div>
                </div>

                <div className="relative">
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                    <Input 
                        placeholder="Buscar alumno..." 
                        className="h-14 md:h-16 pl-12 pr-6 rounded-2xl md:rounded-3xl border-2 border-slate-100 shadow-md font-bold text-base md:text-lg focus:border-[#002147] transition-all bg-white"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Layout Principal: Responsivo */}
            <div className="flex-1 overflow-hidden flex flex-col lg:flex-row gap-6">
                
                {/* Listado de Alumnos - Scroll Horizontal en Móvil, Vertical en Desktop */}
                <div className="flex lg:flex-col lg:w-1/3 overflow-x-auto lg:overflow-y-auto gap-3 pb-4 lg:pb-0 lg:pr-2 custom-scrollbar shrink-0">
                    {filteredEstudiantes.map((est) => (
                        <Card 
                            key={est.id} 
                            onClick={() => setSelectedAlumno(est)}
                            className={`p-4 md:p-5 rounded-2xl md:rounded-3xl cursor-pointer transition-all border-2 flex items-center justify-between group min-w-[160px] lg:min-w-0 shrink-0 ${
                                selectedAlumno?.id === est.id 
                                ? 'bg-[#002147] border-[#002147] text-white shadow-xl scale-[0.98]' 
                                : 'bg-white border-slate-50 hover:border-blue-100 text-slate-700'
                            }`}
                        >
                            <div className="flex items-center gap-3 md:gap-4">
                                <div className={`h-10 w-10 shrink-0 rounded-xl flex items-center justify-center font-black text-sm ${
                                    selectedAlumno?.id === est.id ? 'bg-white/20' : 'bg-slate-100'
                                }`}>
                                    {est.nombre.charAt(0)}
                                </div>
                                <div className="overflow-hidden">
                                    <p className="font-black uppercase text-[10px] md:text-[12px] leading-tight truncate">{est.nombre}</p>
                                    <p className={`text-[8px] md:text-[10px] font-bold uppercase tracking-widest ${
                                        selectedAlumno?.id === est.id ? 'text-blue-100/60' : 'text-slate-400'
                                    }`}>
                                        {est.grado}
                                    </p>
                                </div>
                            </div>
                            <ArrowRight className={`h-4 w-4 hidden md:block transition-transform group-hover:translate-x-1 ${
                                selectedAlumno?.id === est.id ? 'text-white' : 'text-slate-300'
                            }`} />
                        </Card>
                    ))}
                    {filteredEstudiantes.length === 0 && (
                        <div className="text-center py-4 lg:py-10 text-slate-300 italic font-bold text-xs w-full">
                            No hay coincidencias.
                        </div>
                    )}
                </div>

                {/* Detalle de Autorizados - Panel Principal */}
                <div className="flex-1 bg-white lg:bg-slate-50/50 rounded-[32px] md:rounded-[40px] p-4 md:p-8 border-2 border-slate-100 flex flex-col overflow-y-auto custom-scrollbar relative">
                    {selectedAlumno ? (
                        <>
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <span className="text-[8px] md:text-[10px] font-black uppercase text-[#10B981] bg-emerald-50 px-3 py-1 rounded-full mb-1 inline-block">Sustitutos Verificados</span>
                                    <h4 className="text-xl md:text-2xl font-black text-slate-800 uppercase italic tracking-tighter leading-tight">Autorización: {selectedAlumno.nombre}</h4>
                                </div>
                                <UserCheck className="h-8 w-8 md:h-10 md:w-10 text-[#10B981] opacity-20 shrink-0" />
                            </div>

                            {isLoading ? (
                                <div className="flex-1 flex items-center justify-center">
                                    <Loader2 className="h-10 w-10 animate-spin text-slate-200" />
                                </div>
                            ) : authorizedList.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 pb-4">
                                    {authorizedList.map((auth) => (
                                        <Card key={auth.id} className="rounded-[24px] md:rounded-[32px] overflow-hidden border-0 shadow-xl bg-white flex flex-col">
                                            {/* Contenedor de Imagen con Aspect Ratio Fijo */}
                                            <div className="relative aspect-square md:aspect-[4/5] overflow-hidden bg-slate-100 shrink-0">
                                                {auth.foto_url ? (
                                                    <img 
                                                        src={auth.foto_url} 
                                                        alt={auth.nombre_sustituto} 
                                                        referrerPolicy="no-referrer"
                                                        className="w-full h-full object-cover" 
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-slate-300">
                                                        <User className="h-16 w-16" />
                                                    </div>
                                                )}
                                                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-transparent text-white p-4 md:p-6 flex flex-col justify-end">
                                                    <Badge className="bg-[#10B981] text-white border-none font-black text-[8px] md:text-[10px] uppercase mb-1 w-fit">
                                                        {auth.parentesco}
                                                    </Badge>
                                                    <h5 className="font-black text-lg md:text-2xl uppercase italic tracking-tighter leading-tight">{auth.nombre_sustituto}</h5>
                                                </div>
                                            </div>
                                            <div className="p-4 md:p-6 space-y-4">
                                                <div className="flex items-center gap-3 text-slate-600">
                                                    <IdCard className="h-5 w-5 text-slate-300 shrink-0" />
                                                    <span className="font-bold text-xs md:text-sm truncate">ID: {auth.cedula}</span>
                                                </div>
                                                <Button 
                                                    onClick={() => handleDelivery(auth)}
                                                    disabled={!!isActionLoading}
                                                    className="w-full h-12 md:h-14 rounded-2xl bg-[#10B981] hover:bg-emerald-600 text-white font-black text-xs md:text-sm uppercase tracking-widest shadow-lg shadow-emerald-200"
                                                >
                                                    {isActionLoading === auth.id ? (
                                                        <Loader2 className="h-5 w-5 animate-spin" />
                                                    ) : (
                                                        <>
                                                            <CheckCircle2 className="mr-2 h-5 w-5" /> 
                                                            Entregado ✅
                                                        </>
                                                    )}
                                                </Button>
                                            </div>
                                        </Card>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex-1 flex flex-col items-center justify-center text-center p-8 space-y-4">
                                    <div className="bg-white p-5 rounded-full shadow-lg">
                                        <User className="h-10 w-10 text-slate-200" />
                                    </div>
                                    <div>
                                        <p className="font-black text-slate-500 uppercase tracking-tighter">Sin Sustitutos Registrados</p>
                                        <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase">Solo el padre tutor puede autorizar.</p>
                                    </div>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-center p-10 md:p-20 space-y-6">
                            <div className="bg-white p-6 md:p-8 rounded-[32px] md:rounded-[40px] shadow-2xl relative">
                                <Search className="h-12 w-12 md:h-16 md:w-16 text-slate-100" />
                                <div className="absolute -right-2 -top-2 bg-[#10B981] p-2 md:p-3 rounded-xl md:rounded-2xl shadow-lg border-4 border-white">
                                    <ShieldCheck className="h-5 w-5 md:h-6 md:w-6 text-white" />
                                </div>
                            </div>
                            <div>
                                <h4 className="text-lg md:text-xl font-black text-slate-400 italic uppercase leading-tight">Selecciona un alumno</h4>
                                <p className="text-[10px] md:text-sm font-medium text-slate-300 mt-1 uppercase tracking-widest">Verificación de seguridad requerida</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
