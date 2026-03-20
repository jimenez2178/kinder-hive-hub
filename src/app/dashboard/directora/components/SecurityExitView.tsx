"use client";

import React, { useState, useEffect } from "react";
import { 
    ShieldCheck, 
    Search, 
    User, 
    IdCard, 
    Phone, 
    UserCheck,
    Loader2,
    Calendar,
    ArrowRight
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { getAuthorizedByStudentAction } from "@/app/actions/autorizaciones";

interface SecurityExitViewProps {
    estudiantes: any[];
}

export default function SecurityExitView({ estudiantes }: SecurityExitViewProps) {
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedAlumno, setSelectedAlumno] = useState<any | null>(null);
    const [authorizedList, setAuthorizedList] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);

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

    return (
        <div className="flex flex-col h-full max-h-[75vh]">
            <div className="flex flex-col gap-6 mb-8 px-2">
                <div>
                    <h3 className="text-3xl font-black text-slate-900 italic uppercase tracking-tighter flex items-center gap-3">
                        <ShieldCheck className="h-8 w-8 text-[#10B981]" />
                        Seguridad de Salida
                    </h3>
                    <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-1">Verificación de autorizaciones en tiempo real</p>
                </div>

                <div className="relative">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                    <Input 
                        placeholder="Buscar alumno por nombre..." 
                        className="h-16 pl-14 pr-6 rounded-3xl border-2 border-slate-100 shadow-md font-bold text-lg focus:border-[#002147] transition-all bg-white"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="flex-1 overflow-hidden flex flex-col lg:flex-row gap-8">
                {/* Listado de Alumnos */}
                <div className="lg:w-1/3 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                    {filteredEstudiantes.map((est) => (
                        <Card 
                            key={est.id} 
                            onClick={() => setSelectedAlumno(est)}
                            className={`p-5 rounded-3xl cursor-pointer transition-all border-2 flex items-center justify-between group ${
                                selectedAlumno?.id === est.id 
                                ? 'bg-[#002147] border-[#002147] text-white shadow-xl' 
                                : 'bg-white border-slate-50 hover:border-blue-100 text-slate-700'
                            }`}
                        >
                            <div className="flex items-center gap-4">
                                <div className={`h-11 w-11 rounded-2xl flex items-center justify-center font-black text-sm ${
                                    selectedAlumno?.id === est.id ? 'bg-white/20' : 'bg-slate-100'
                                }`}>
                                    {est.nombre.charAt(0)}
                                </div>
                                <div>
                                    <p className="font-black uppercase text-[12px] leading-tight mb-0.5">{est.nombre}</p>
                                    <p className={`text-[10px] font-bold uppercase tracking-widest ${
                                        selectedAlumno?.id === est.id ? 'text-blue-100/60' : 'text-slate-400'
                                    }`}>
                                        {est.grado}
                                    </p>
                                </div>
                            </div>
                            <ArrowRight className={`h-4 w-4 transition-transform group-hover:translate-x-1 ${
                                selectedAlumno?.id === est.id ? 'text-white' : 'text-slate-300'
                            }`} />
                        </Card>
                    ))}

                    {filteredEstudiantes.length === 0 && (
                        <div className="text-center py-10 text-slate-300 italic font-bold">
                            No se encontraron alumnos.
                        </div>
                    )}
                </div>

                {/* Detalle de Autorizados */}
                <div className="lg:w-2/3 bg-slate-50/50 rounded-[40px] p-8 border-2 border-slate-100 flex flex-col overflow-y-auto custom-scrollbar relative">
                    {selectedAlumno ? (
                        <>
                            <div className="flex items-center justify-between mb-8">
                                <div>
                                    <span className="text-[10px] font-black uppercase text-[#10B981] bg-emerald-50 px-3 py-1 rounded-full mb-2 inline-block">Sustitutos Verificados</span>
                                    <h4 className="text-2xl font-black text-slate-800 uppercase italic tracking-tighter">Recogida de: {selectedAlumno.nombre}</h4>
                                </div>
                                <UserCheck className="h-10 w-10 text-[#10B981] opacity-20" />
                            </div>

                            {isLoading ? (
                                <div className="flex-1 flex items-center justify-center">
                                    <Loader2 className="h-10 w-10 animate-spin text-slate-200" />
                                </div>
                            ) : authorizedList.length > 0 ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pb-4">
                                    {authorizedList.map((auth) => (
                                        <Card key={auth.id} className="rounded-[40px] overflow-hidden border-0 shadow-2xl bg-white group hover:scale-[1.02] transition-transform">
                                            <div className="aspect-[4/5] relative">
                                                {auth.foto_url ? (
                                                    <img 
                                                        src={auth.foto_url} 
                                                        alt={auth.nombre_sustituto} 
                                                        referrerPolicy="no-referrer"
                                                        className="w-full h-full object-cover" 
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center bg-slate-100 text-slate-300">
                                                        <User className="h-20 w-20" />
                                                    </div>
                                                )}
                                                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent text-white p-6 flex flex-col justify-end">
                                                    <Badge className="bg-[#10B981] text-white border-none font-black text-[10px] uppercase mb-1 w-fit">
                                                        {auth.parentesco}
                                                    </Badge>
                                                    <h5 className="font-black text-2xl uppercase italic tracking-tighter leading-tight">{auth.nombre_sustituto}</h5>
                                                </div>
                                            </div>
                                            <div className="p-6 space-y-3">
                                                <div className="flex items-center gap-3 text-slate-600">
                                                    <IdCard className="h-5 w-5 text-slate-300" />
                                                    <span className="font-black text-sm">Cédula: {auth.cedula}</span>
                                                </div>
                                                <div className="flex items-center gap-3 text-emerald-600 bg-emerald-50 p-3 rounded-2xl border border-emerald-100">
                                                    <ShieldCheck className="h-5 w-5" />
                                                    <span className="font-black text-[10px] uppercase tracking-widest">Autorizado por Tutor</span>
                                                </div>
                                            </div>
                                        </Card>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex-1 flex flex-col items-center justify-center text-center p-12 space-y-4">
                                    <div className="bg-white p-5 rounded-full shadow-lg">
                                        <User className="h-10 w-10 text-slate-200" />
                                    </div>
                                    <div>
                                        <p className="font-black text-slate-500 uppercase tracking-tighter">Sin Sustitutos Registrados</p>
                                        <p className="text-xs font-bold text-slate-400 mt-1">Solo el padre tutor puede autorizar recogidas.</p>
                                    </div>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-center p-20 space-y-6">
                            <div className="bg-white p-8 rounded-[40px] shadow-2xl relative">
                                <Search className="h-16 w-16 text-slate-100" />
                                <div className="absolute -right-2 -top-2 bg-[#10B981] p-3 rounded-2xl shadow-lg border-4 border-white">
                                    <ShieldCheck className="h-6 w-6 text-white" />
                                </div>
                            </div>
                            <div>
                                <h4 className="text-xl font-black text-slate-400 italic uppercase">Selecciona un alumno</h4>
                                <p className="text-sm font-medium text-slate-300 mt-1">Para verificar quién está autorizado a recogerlo</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
