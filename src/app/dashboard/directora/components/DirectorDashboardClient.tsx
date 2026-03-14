"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { addPaymentAction, addEventAction, addPhotoAction, addEstudianteAction, addComunicadoAction, addAgradecimientoAction, deleteEstudianteAction, deleteAllEstudiantesAction, approveParentAction, rejectParentAction } from "@/app/actions/directora";
import { LogoutButton } from "@/components/LogoutButton";
import { Badge } from "@/components/ui/badge";
import { Calendar, CreditCard, Image as ImageIcon, Plus, Users, Megaphone, Heart, Eye, BarChart3, Trash2, Wallet, TrendingUp, FileText, Printer, Search, CheckCircle, XCircle, SearchIcon } from "lucide-react";
import DashboardClient from "@/app/components/DashboardClient";
import { approvePaymentAction, rejectPaymentAction } from "@/app/actions/directora";
import Link from "next/link";

export function DirectorDashboardClient({ estudiantes, padres, usuariosPendientes, pagosRevision, metrics, previewData }: {
    estudiantes: any[],
    padres: { id: string, nombre: string, nombre_completo: string | null }[],
    usuariosPendientes: { id: string, nombre: string, nombre_completo: string | null, created_at: string }[],
    pagosRevision: any[],
    metrics: {
        ingresosDelMes: number,
        metaTotal: number,
        pendientes: number,
        porcentajeCobro: number,
        totalEstudiantes: number,
        alDia: number,
        comunicadosCount: number,
        trendData: { month: string, total: number }[]
    },
    previewData: { comunicado: any, galeria: any[], eventos: any[], agradecimientos: any[] }
}) {
    const [activeModal, setActiveModal] = useState<"pago" | "evento" | "foto" | "estudiante" | "comunicado" | "agradecimiento" | "pendientes" | "revisar_pagos" | null>(null);
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
    const [showPreview, setShowPreview] = useState(false);
    const [showReport, setShowReport] = useState(false);
    const [toast, setToast] = useState<{ message: string, visible: boolean }>({ message: "", visible: false });
    const [isLoading, setIsLoading] = useState(false);

    // --- Buscador de Alumnos ---
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedStudent, setSelectedStudent] = useState<{ id: string, nombre: string } | null>(null);
    const filteredEstudiantes = estudiantes.filter(e =>
        e.nombre.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // --- Estado pago multi-meses ---
    const [cantidadMeses, setCantidadMeses] = useState(1);
    const [montoPorMes, setMontoPorMes] = useState(0);

    // --- Estado prioridad comunicado ---
    const [prioridadSelected, setPrioridadSelected] = useState<"alta" | "media" | "baja">("baja");

    const showToast = (message: string) => {
        setToast({ message, visible: true });
        setTimeout(() => setToast({ message: "", visible: false }), 4000);
    };

    const handleAction = async (actionFn: (prevState: unknown, formData: FormData) => Promise<{ error?: string, success?: boolean, timestamp?: number }>, formData: FormData) => {
        setIsLoading(true);
        const result = await actionFn(null, formData);
        setIsLoading(false);

        if (result?.error) {
            alert("Error: " + result.error);
        } else {
            setActiveModal(null);
            showToast("¡Registro guardado correctamente!");
        }
    };

    return (
        <>
            <div className="container mx-auto max-w-6xl pt-8 px-4 sm:px-6 pb-20">

                {/* 1. HEADER REBRANDING - BANNER VERDE VIBRANTE (ESTILO PREMIUM) */}
                <header className="bg-[#7ed957] rounded-[40px] p-8 mb-10 text-[#020617] shadow-xl shadow-[#7ed957]/20 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
                    <div className="flex items-center gap-6 z-10">
                        <div className="bg-white p-1.5 rounded-[35px] shadow-xl flex items-center justify-center">
                            <img
                                src="https://informativolatelefonica.com/wp-content/uploads/2026/03/LOGO.png"
                                alt="Logo Sagrada Familia"
                                className="h-28 w-28 object-contain transition-transform hover:scale-110 duration-500"
                            />
                        </div>
                        <div>
                            <h1 className="text-2xl md:text-4xl font-black tracking-tighter italic leading-none">
                                ¡Bienvenida Directora Carmen Cortorreal! 👋
                            </h1>
                            <p className="text-[#020617]/80 font-bold text-lg mt-2">
                                Está en su panel directivo.
                            </p>
                        </div>
                    </div>

                    <div className="z-10 flex flex-col items-end gap-2">
                        <div className="bg-black/5 p-2 rounded-[32px] backdrop-blur-sm">
                            <LogoutButton />
                        </div>
                        <Badge className="bg-white/40 text-black border-none font-black px-4 py-1 rounded-full">
                            Ciclo 2026-2027
                        </Badge>
                    </div>

                    {/* Decoración abstracta de fondo */}
                    <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-white/20 rounded-full blur-3xl"></div>
                </header>

                {/* 2. ACCIONES RÁPIDAS - BOTONES REDONDEADOS */}
                <div className="flex flex-wrap gap-3 mb-12">
                    <Button
                        onClick={() => setActiveModal("comunicado")}
                        className="rounded-full bg-[#8A2BE2] hover:bg-[#7726c5] text-white font-black h-12 px-6 shadow-lg shadow-[#8A2BE2]/20"
                    >
                        <Megaphone className="mr-2 h-5 w-5" /> Publicar Aviso
                    </Button>
                    <Button
                        onClick={() => setActiveModal("pago")}
                        className="rounded-full bg-[#004aad] hover:bg-[#003785] text-white font-black h-12 px-6 shadow-lg shadow-[#004aad]/20"
                    >
                        <CreditCard className="mr-2 h-5 w-5" /> Registrar Pago
                    </Button>
                    <Button
                        onClick={() => setActiveModal("revisar_pagos")}
                        className="rounded-full bg-amber-500 hover:bg-amber-600 text-white font-black h-12 px-6 shadow-lg shadow-amber-500/20 relative"
                    >
                        <Wallet className="mr-2 h-5 w-5" /> Verificar Pagos
                        {pagosRevision.filter(p => p.estado === 'en_revision' || p.estado === 'pendiente').length > 0 && (
                            <span className="absolute -top-2 -right-2 bg-black text-white text-xs rounded-full h-6 w-6 flex items-center justify-center border-2 border-white">
                                {pagosRevision.filter(p => p.estado === 'en_revision' || p.estado === 'pendiente').length}
                            </span>
                        )}
                    </Button>
                    <Button
                        onClick={() => setActiveModal("estudiante")}
                        className="rounded-full bg-[#7ed957] hover:bg-[#6ec54a] text-[#020617] font-black h-12 px-6 shadow-lg shadow-[#7ed957]/20"
                    >
                        <Plus className="mr-1 h-5 w-5" /> Inscribir Alumno
                    </Button>
                    <Button
                        onClick={() => setActiveModal("pendientes")}
                        className={`rounded-full ${usuariosPendientes.length > 0 ? 'bg-rose-600 animate-pulse' : 'bg-rose-500'} hover:bg-rose-600 text-white font-black h-12 px-6 shadow-lg shadow-rose-500/20 relative transition-all`}
                    >
                        <Users className={`mr-2 h-5 w-5 ${usuariosPendientes.length > 0 ? 'animate-bounce' : ''}`} /> Solicitudes
                        {usuariosPendientes.length > 0 && (
                            <span className="absolute -top-2 -right-2 bg-black text-white text-xs rounded-full h-6 w-6 flex items-center justify-center border-2 border-white">
                                {usuariosPendientes.length}
                            </span>
                        )}
                    </Button>
                    <Button
                        onClick={() => setActiveModal("evento")}
                        className="rounded-full bg-[#FF8C00] hover:bg-[#e67e00] text-white font-black h-12 px-6 shadow-lg shadow-[#FF8C00]/20"
                    >
                        <Calendar className="mr-2 h-5 w-5" /> Nuevo Evento
                    </Button>
                    <Button
                        onClick={() => setActiveModal("foto")}
                        className="rounded-full bg-[#00d2ff] hover:bg-[#00b8e6] text-white font-black h-12 px-6 shadow-lg shadow-[#00d2ff]/20"
                    >
                        <ImageIcon className="mr-2 h-5 w-5" /> Subir Foto
                    </Button>
                    <Button
                        onClick={() => setActiveModal("agradecimiento")}
                        className="rounded-full bg-[#ff4b2b] hover:bg-[#e63e20] text-white font-black h-12 px-6 shadow-lg shadow-[#ff4b2b]/20"
                    >
                        <Heart className="mr-2 h-5 w-5" /> Agradecer
                    </Button>
                    <Button
                        onClick={() => setShowPreview(!showPreview)}
                        variant="outline"
                        className="rounded-full border-2 border-slate-200 font-black h-12 px-6 ml-auto hover:bg-slate-50"
                    >
                        <Eye className="mr-2 h-5 w-5" /> {showPreview ? "Cerrar Vista" : "Vista Padres"}
                    </Button>
                    <Button
                        onClick={() => setShowReport(true)}
                        className="rounded-full bg-slate-800 hover:bg-slate-700 text-white font-black h-12 px-6 shadow-lg"
                    >
                        <FileText className="mr-2 h-5 w-5" /> Reporte Mensual
                    </Button>
                </div>

                {/* 3. KPI GRID - LÓGICA FINANCIERA ACTUALIZADA */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">

                    {/* Tarjeta Púrpura - Estudiantes */}
                    <Card className="rounded-[35px] bg-[#8A2BE2] text-white border-0 shadow-2xl overflow-hidden relative group">
                        <CardContent className="p-6">
                            <Users className="absolute -right-4 -bottom-4 h-24 w-24 text-white/10 group-hover:scale-110 transition-transform" />
                            <p className="text-xs font-black uppercase tracking-widest text-white/70">Total Alumnos</p>
                            <h3 className="text-5xl font-black mt-2">{estudiantes.length}</h3>
                            <div className="mt-4 flex items-center gap-2">
                                <Badge className="bg-white/20 hover:bg-white/30 border-none text-white font-bold">
                                    +3 este mes
                                </Badge>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Tarjeta Amarilla - Finanzas (DINÁMICA) */}
                    <Card className="rounded-[35px] bg-[#ffcc00] text-[#020617] border-0 shadow-2xl overflow-hidden relative group">
                        <CardContent className="p-6">
                            <Wallet className="absolute -right-4 -bottom-4 h-24 w-24 text-black/5 group-hover:scale-110 transition-transform" />
                            <p className="text-xs font-black uppercase tracking-widest text-black/50">Cobros del Mes</p>
                            <h3 className="text-4xl font-black mt-2 tracking-tighter">
                                RD$ {metrics.ingresosDelMes.toLocaleString('es-DO')}
                            </h3>
                            {/* Barra de Progreso de Recaudación */}
                            {metrics.metaTotal > 0 && (
                                <div className="mt-3">
                                    <div className="w-full bg-black/10 rounded-full h-2">
                                        <div
                                            className="bg-[#004aad] h-2 rounded-full transition-all duration-700"
                                            style={{ width: `${Math.min(100, Math.round((metrics.ingresosDelMes / metrics.metaTotal) * 100))}%` }}
                                        />
                                    </div>
                                    <div className="flex items-center justify-between mt-1">
                                        <p className="text-[10px] font-bold opacity-70 italic text-black">
                                            {Math.min(100, Math.round((metrics.ingresosDelMes / metrics.metaTotal) * 100))}% de RD$ {metrics.metaTotal.toLocaleString('es-DO')}
                                        </p>
                                        <button
                                            onClick={() => alert('Generando reporte de pagos...')}
                                            className="text-[10px] font-black uppercase underline hover:text-[#004aad] transition-colors"
                                        >
                                            Ver Resumen →
                                        </button>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Tarjeta Blanca - Pagos al Día */}
                    <Card className="rounded-[35px] bg-white border-0 shadow-xl relative overflow-hidden group">
                        <CardContent className="p-6">
                            <TrendingUp className="absolute -right-4 -bottom-4 h-24 w-24 text-slate-50 group-hover:scale-110 transition-transform" />
                            <p className="text-xs font-black uppercase tracking-widest text-slate-400">Pagos al Día</p>
                            <h3 className="text-5xl font-black mt-2 text-green-600">{metrics.alDia}</h3>
                            <p className="text-[10px] font-bold mt-2 text-slate-400">{metrics.porcentajeCobro}% de efectividad este mes</p>
                        </CardContent>
                    </Card>

                    {/* Tarjeta Blanca - Pendientes */}
                    <Card className="rounded-[35px] bg-white border-0 shadow-xl relative overflow-hidden group">
                        <CardContent className="p-6">
                            <CreditCard className="absolute -right-4 -bottom-4 h-24 w-24 text-red-50 group-hover:scale-110 transition-transform" />
                            <p className="text-xs font-black uppercase tracking-widest text-slate-400">Por Cobrar</p>
                            <h3 className="text-5xl font-black mt-2 text-red-500">{metrics.pendientes}</h3>
                            <p className="text-[10px] font-bold mt-2 text-red-400">Requiere seguimiento</p>
                        </CardContent>
                    </Card>
                </div>

                {/* --- SECCIÓN DE ESTADÍSTICAS Y CUMPLEAÑOS --- */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
                    {/* Gráfico de Tendencia */}
                    <Card className="lg:col-span-2 rounded-[40px] border-0 shadow-2xl bg-white p-8">
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h3 className="text-2xl font-black text-slate-800 italic uppercase tracking-tighter">Historial de Ingresos</h3>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Análisis de flujo de caja</p>
                            </div>
                            <div className="h-12 w-12 bg-[#004aad]/10 rounded-2xl flex items-center justify-center">
                                <BarChart3 className="text-[#004aad] h-6 w-6" />
                            </div>
                        </div>

                        <div className="flex items-end justify-around h-64 gap-8 px-8 border-b-2 border-slate-50">
                            {metrics.trendData.map((item, i) => {
                                const maxVal = Math.max(...metrics.trendData.map(d => d.total), 1);
                                const heightPc = (item.total / maxVal) * 90;
                                const isCurrent = i === metrics.trendData.length - 1;

                                return (
                                    <div key={i} className="flex-1 max-w-[120px] flex flex-col items-center gap-4 group">
                                        <div
                                            className="w-full relative rounded-t-[20px] transition-all duration-700 hover:scale-x-105 cursor-pointer flex items-end justify-center"
                                            style={{
                                                height: `${Math.max(heightPc, 5)}%`,
                                                backgroundColor: isCurrent ? '#8A2BE2' : '#f1f5f9',
                                                boxShadow: isCurrent ? `0 15px 30px #8A2BE244` : 'none'
                                            }}
                                        >
                                            <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] font-black px-3 py-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                                RD$ {item.total?.toLocaleString()}
                                            </div>
                                        </div>
                                        <span className={`text-[10px] font-black uppercase tracking-tighter text-center ${isCurrent ? 'text-[#8A2BE2]' : 'text-slate-400'}`}>
                                            {item.month}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </Card>

                    {/* Cumpleaños Widget */}
                    <Card className="rounded-[40px] border-0 shadow-2xl bg-white p-8 relative overflow-hidden flex flex-col justify-between">
                        <div className="absolute top-0 right-0 p-4 opacity-5">
                            <Heart className="h-32 w-32 text-[#FF1493]" fill="currentColor" />
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-[#004aad] flex items-center gap-2 mb-1">
                                Próximas Fiestas 🎂
                            </h3>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-6">Comunidad Sagrada Familia</p>

                            <div className="space-y-3 relative">
                                {estudiantes
                                    .filter(e => e.fecha_nacimiento)
                                    .map(e => {
                                        // Corregir desfase de zona horaria añadiendo mediodía
                                        const bday = new Date(e.fecha_nacimiento + 'T12:00:00');
                                        const now = new Date();
                                        const thisYearBday = new Date(now.getFullYear(), bday.getMonth(), bday.getDate());
                                        const nextYearBday = new Date(now.getFullYear() + 1, bday.getMonth(), bday.getDate());
                                        
                                        // Si ya pasó este año, usamos el del próximo
                                        const diff = thisYearBday.getTime() - now.getTime();
                                        const targetDate = diff >= -86400000 ? thisYearBday : nextYearBday; // -24h para incluir el día de hoy con margen
                                        const daysTo = Math.ceil((targetDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                                        
                                        return { ...e, daysTo, targetDate };
                                    })
                                    .sort((a, b) => a.daysTo - b.daysTo)
                                    .slice(0, 3)
                                    .map((item) => (
                                        <div key={item.id} className={`p-4 rounded-[25px] border-2 transition-all flex items-center justify-between ${item.daysTo < 7 ? 'bg-pink-50 border-pink-100' : 'bg-slate-50 border-transparent hover:border-[#8A2BE2]/20'}`}>
                                            <div className="flex items-center gap-3">
                                                <div className={`h-10 w-10 rounded-full flex items-center justify-center font-black text-white shadow-lg ${item.daysTo < 7 ? 'bg-[#FF1493] animate-pulse' : 'bg-slate-300'}`}>
                                                    {item.daysTo <= 0 ? '🥳' : item.daysTo}
                                                </div>
                                                <div>
                                                    <p className="font-black text-slate-800 text-sm leading-tight">{item.nombre}</p>
                                                    <p className="text-[10px] font-bold text-[#8A2BE2] uppercase italic">
                                                        {item.daysTo === 0 ? '¡HOY ES SU CUMPLE!' : item.daysTo < 7 ? '¡Esta semana!' : `En ${item.daysTo} días`}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="bg-white p-2 px-3 rounded-xl shadow-sm text-center border border-slate-100">
                                                <p className="text-[9px] font-black text-slate-400 uppercase leading-none">{item.targetDate.toLocaleDateString('es-DO', { month: 'short' }).replace('.', '').toUpperCase()}</p>
                                                <p className="text-xl font-black text-slate-800 leading-none">{item.targetDate.getDate()}</p>
                                            </div>
                                        </div>
                                    ))}
                                {estudiantes.filter(e => e.fecha_nacimiento).length === 0 && (
                                    <div className="text-center py-10 opacity-30 italic">
                                        <p className="text-sm font-bold">No hay fechas registradas</p>
                                    </div>
                                )}
                            </div>
                        </div>
                        <Button className="w-full mt-6 bg-[#25D366] hover:bg-[#128C7E] text-white font-black rounded-full shadow-lg shadow-[#25D366]/20">
                            Felicitar a Todos 📱
                        </Button>
                    </Card>
                </div>

                {/* --- TABLA DE ALUMNOS (REDISEÑADA) --- */}
                <Card className="rounded-[40px] border-0 shadow-2xl overflow-hidden bg-white">
                    <CardHeader className="bg-slate-50/50 py-8 px-10 flex flex-row items-center justify-between border-b border-slate-100">
                        <div>
                            <CardTitle className="text-2xl font-black text-slate-800 italic uppercase tracking-tighter">
                                Registro de Alumnos
                            </CardTitle>
                            <p className="text-xs font-bold text-slate-400">Total: {estudiantes.length} inscritos</p>
                        </div>
                        <div className="flex gap-2">
                            <Button
                                onClick={() => setActiveModal("estudiante")}
                                className="rounded-full bg-[#7ed957] hover:bg-[#6ec54a] text-[#020617] font-black px-6 shadow-md"
                            >
                                <Plus className="mr-1 h-4 w-4" /> Nuevo Alumno
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="bg-slate-50 text-[10px] uppercase tracking-widest text-slate-400 font-black">
                                        <th className="py-6 px-10">Nombre del Alumno</th>
                                        <th className="py-6 px-6">Grado Académico</th>
                                        <th className="py-6 px-6">Tutor / Correo</th>
                                        <th className="py-6 px-10 text-right">Gestión</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {estudiantes.map((est) => (
                                        <tr key={est.id} className="hover:bg-slate-50/30 transition-colors group">
                                            <td className="py-5 px-10 font-bold text-slate-700 flex items-center gap-3">
                                                <div className="h-8 w-8 rounded-full bg-[#8A2BE2]/10 flex items-center justify-center text-[#8A2BE2] text-xs font-black">
                                                    {est.nombre.charAt(0)}
                                                </div>
                                                {est.nombre}
                                            </td>
                                            <td className="py-5 px-6">
                                                <Badge className="bg-slate-100 text-slate-500 border-none font-bold">
                                                    {est.grado}
                                                </Badge>
                                            </td>
                                            <td className="py-5 px-6">
                                                <div className="text-xs font-bold text-slate-500 truncate max-w-[150px]">
                                                    {est.tutor_nombre || "—"}
                                                </div>
                                            </td>
                                            <td className="py-5 px-10 text-right">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={async () => {
                                                        if (confirm("¿Estás seguro de eliminar este alumno?")) {
                                                            setIsLoading(true);
                                                            const res = await deleteEstudianteAction(est.id);
                                                            setIsLoading(false);
                                                            if (res.error) alert(res.error);
                                                            else showToast("Alumno eliminado");
                                                        }
                                                    }}
                                                    className="rounded-full hover:bg-red-50 text-slate-300 hover:text-red-500 transition-all"
                                                >
                                                    <Trash2 className="h-5 w-5" />
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>

                {/* Vista Previa de Padres */}
                {showPreview && (
                    <div className="mt-12 p-8 bg-slate-900 rounded-[50px] shadow-3xl">
                        <div className="flex items-center justify-between mb-8">
                            <Badge className="bg-[#7ed957] text-black font-black px-6 py-2 rounded-full">
                                MODO SIMULACIÓN PADRES
                            </Badge>
                            <Button variant="ghost" className="text-white hover:bg-white/10" onClick={() => setShowPreview(false)}>✕ Cerrar</Button>
                        </div>
                        <div className="rounded-[40px] overflow-hidden border-8 border-slate-800 scale-[0.95]">
                            <DashboardClient
                                initialFrase="Modo Previsualización"
                                userName="Padre de Isabella"
                                saldoPendiente={11000}
                                estudiantes={estudiantes.slice(0, 1)}
                                comunicado={previewData.comunicado}
                                galeria={previewData.galeria}
                                recibos={[]}
                                eventos={previewData.eventos}
                                agradecimientos={previewData.agradecimientos}
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* === MODAL REPORTE MENSUAL === */}
            {showReport && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-xl print:p-0 print:bg-white print:relative print:z-0">
                    <div className="w-full max-w-2xl bg-white rounded-[40px] shadow-3xl flex flex-col max-h-[90vh] overflow-hidden print:max-h-none print:rounded-none print:shadow-none animate-in zoom-in-95 duration-300">
                        {/* Header del Reporte */}
                        <div className="bg-gradient-to-r from-slate-800 to-slate-900 p-8 flex items-center justify-between print:bg-white print:border-b-2 print:border-slate-200">
                            <div className="flex items-center gap-5">
                                <img src="https://informativolatelefonica.com/wp-content/uploads/2026/03/LOGO.png" className="h-16 w-16 object-contain bg-white p-1 rounded-2xl" alt="Logo" />
                                <div>
                                    <h2 className="text-xl font-black text-white print:text-slate-900 tracking-tighter">Pre-escolar Sagrada Familia</h2>
                                    <p className="text-slate-400 text-sm font-bold print:text-slate-500">Reporte Ejecutivo Mensual — {new Date().toLocaleDateString('es-DO', { month: 'long', year: 'numeric' }).toUpperCase()}</p>
                                </div>
                            </div>
                            <button onClick={() => setShowReport(false)} className="text-slate-400 hover:text-white text-2xl font-black print:hidden transition-colors">✕</button>
                        </div>

                        {/* Cuerpo del Reporte - Scroll interno */}
                        <div className="flex-1 overflow-y-auto p-8 space-y-6 print:overflow-visible custom-scrollbar">
                            {/* KPIs del Reporte */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-[#8A2BE2]/5 border border-[#8A2BE2]/10 rounded-[32px] p-6 group hover:bg-[#8A2BE2]/10 transition-colors">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-[#8A2BE2] mb-1">Total Estudiantes</p>
                                    <div className="flex items-baseline gap-2">
                                        <p className="text-5xl font-black text-slate-800">{estudiantes.length}</p>
                                        <Users className="h-5 w-5 text-[#8A2BE2] opacity-30" />
                                    </div>
                                    <p className="text-[10px] text-slate-400 font-bold mt-2 uppercase">Ciclo 2026-2027</p>
                                </div>
                                <div className="bg-[#ffcc00]/10 border border-[#ffcc00]/20 rounded-[32px] p-6 group hover:bg-[#ffcc00]/20 transition-colors">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-amber-600 mb-1">Recaudación Total</p>
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-lg font-black text-amber-600">RD$</span>
                                        <p className="text-4xl font-black text-slate-800 tracking-tighter">{metrics.ingresosDelMes.toLocaleString('es-DO')}</p>
                                    </div>
                                    <p className="text-[10px] text-slate-400 font-bold mt-2 uppercase">Ingresos confirmados</p>
                                </div>
                                <div className="bg-red-50/50 border border-red-100/50 rounded-[32px] p-6 group hover:bg-red-50 transition-colors">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-red-400 mb-1">Balance Pendiente</p>
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-lg font-black text-red-400">RD$</span>
                                        <p className="text-4xl font-black text-red-500 tracking-tighter">
                                            {(metrics.metaTotal - metrics.ingresosDelMes).toLocaleString('es-DO')}
                                        </p>
                                    </div>
                                    <p className="text-[10px] text-slate-400 font-bold mt-2 uppercase">{metrics.pendientes} alumnos con saldo</p>
                                </div>
                                <div className="bg-green-50/50 border border-green-100/50 rounded-[32px] p-6 group hover:bg-green-50 transition-colors">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-green-500 mb-1">Efectividad</p>
                                    <div className="flex items-baseline gap-2">
                                        <p className="text-5xl font-black text-green-600">{metrics.porcentajeCobro}%</p>
                                        <TrendingUp className="h-5 w-5 text-green-500 opacity-30" />
                                    </div>
                                    <p className="text-[10px] text-slate-400 font-bold mt-2 uppercase">{metrics.alDia} pagos al día</p>
                                </div>
                            </div>

                            {/* Barra de Progreso General */}
                            <div className="bg-slate-50/50 border border-slate-100 rounded-[32px] p-8 space-y-4">
                                <div className="flex justify-between items-end">
                                    <div>
                                        <p className="text-xs font-black uppercase tracking-widest text-slate-500 mb-1">Alcance de Meta Mensual</p>
                                        <p className="text-sm font-bold text-slate-400">Comparativa Ingresos vs Meta</p>
                                    </div>
                                    <p className="text-2xl font-black text-[#004aad]">{Math.min(100, Math.round((metrics.ingresosDelMes / (metrics.metaTotal || 1)) * 100))}%</p>
                                </div>
                                <div className="w-full bg-white rounded-full h-5 p-1 border border-slate-100 shadow-inner">
                                    <div
                                        className="h-full rounded-full bg-gradient-to-r from-[#004aad] to-[#8A2BE2] transition-all duration-1000 relative"
                                        style={{ width: `${Math.min(100, Math.round((metrics.ingresosDelMes / (metrics.metaTotal || 1)) * 100))}%` }}
                                    >
                                        <div className="absolute inset-0 bg-white/20 animate-pulse rounded-full"></div>
                                    </div>
                                </div>
                                <div className="flex justify-between text-[11px] font-black text-slate-400 uppercase tracking-tighter">
                                    <span>RD$ 0</span>
                                    <span>Meta total: RD$ {metrics.metaTotal.toLocaleString('es-DO')}</span>
                                </div>
                            </div>

                            {/* Avisos Activos */}
                            <div className="flex items-center justify-between bg-slate-900 text-white rounded-[32px] px-8 py-6 relative overflow-hidden group">
                                <div className="absolute right-0 top-0 h-full w-32 bg-[#7ed957] skew-x-[-20deg] translate-x-16 opacity-10 group-hover:translate-x-12 transition-transform"></div>
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-[#7ed957] mb-1">Avisos Vigentes</p>
                                    <p className="text-4xl font-black">{metrics.comunicadosCount}</p>
                                </div>
                                <div className="text-right z-10">
                                    <p className="text-[10px] font-black text-slate-400 uppercase">Certificado por</p>
                                    <p className="font-black text-[#7ed957] text-lg italic tracking-tighter">Kinder Hive Hub</p>
                                    <p className="text-[10px] text-slate-400 font-bold">{new Date().toLocaleDateString('es-DO', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                                </div>
                            </div>
                        </div>

                        {/* Footer - Botones Fijos */}
                        <div className="p-8 bg-slate-50/50 border-t border-slate-100 print:hidden">
                            <div className="flex gap-4">
                                <Button
                                    variant="outline"
                                    onClick={() => setShowReport(false)}
                                    className="flex-1 h-12 rounded-2xl font-black text-slate-400 border-slate-200"
                                >
                                    Cerrar
                                </Button>
                                <Button
                                    onClick={() => window.print()}
                                    className="flex-[2] h-12 rounded-2xl font-black bg-slate-800 hover:bg-slate-700 text-white shadow-lg flex items-center justify-center gap-2"
                                >
                                    <Printer className="h-5 w-5" /> Imprimir / Guardar PDF
                                </Button>
                            </div>
                            <p className="text-center text-[9px] font-black text-slate-300 uppercase tracking-[0.3em] mt-6 print:block hidden">Kinder Hive Hub — Plataforma de Gestión Administrativa 2026</p>
                        </div>
                    </div>
                </div>
            )}

            {/* --- MODALS DE ACCIÓN --- */}
            {activeModal && (
                <div 
                    className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-md overflow-y-auto flex justify-center py-10 px-4 animate-in fade-in duration-300"
                    onClick={() => setActiveModal(null)}
                >
                    <Card 
                        className="w-full max-w-lg h-fit rounded-[40px] border-0 shadow-3xl bg-white overflow-hidden animate-in zoom-in-95 duration-300"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <CardHeader className="bg-slate-50 p-8 border-b border-slate-100 flex flex-row items-center justify-between">
                            <div>
                                <CardTitle className="text-2xl font-black text-slate-800 italic uppercase">
                                    {activeModal === "pago" && "Registrar Pago"}
                                    {activeModal === "evento" && "Nuevo Evento"}
                                    {activeModal === "comunicado" && "Publicar Aviso"}
                                    {activeModal === "foto" && "Subir a Galería"}
                                    {activeModal === "estudiante" && "Inscribir Alumno"}
                                    {activeModal === "agradecimiento" && "Enviar Agradecimiento"}
                                    {activeModal === "pendientes" && "Aprobar Accesos"}
                                    {activeModal === "revisar_pagos" && "Validar Comprobantes"}
                                </CardTitle>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                    {activeModal === "pendientes" && "Usuarios esperando acceso al portal familiar"}
                                    {activeModal === "revisar_pagos" && "Revisión de transferencias y depósitos bancarios"}
                                    {(activeModal !== "pendientes" && activeModal !== "revisar_pagos") && "Complete los campos requeridos"}
                                </p>
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setActiveModal(null)}
                                className="rounded-full hover:bg-slate-200"
                            >
                                <Plus className="rotate-45 h-6 w-6 text-slate-400" />
                            </Button>
                        </CardHeader>

                        <form
                            onSubmit={async (e) => {
                                e.preventDefault();
                                const formData = new FormData(e.currentTarget);
                                if (activeModal === "pago") await handleAction(addPaymentAction, formData);
                                if (activeModal === "evento") await handleAction(addEventAction, formData);
                                if (activeModal === "comunicado") await handleAction(addComunicadoAction, formData);
                                if (activeModal === "foto") await handleAction(addPhotoAction, formData);
                                if (activeModal === "estudiante") await handleAction(addEstudianteAction, formData);
                                if (activeModal === "agradecimiento") await handleAction(addAgradecimientoAction, formData);
                            }}
                            className="p-8 space-y-6"
                        >
                            {activeModal === "pago" && (
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <Label className="font-black text-xs uppercase text-slate-500 ml-2">Buscar Alumno</Label>
                                            <div className="relative group">
                                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#004aad] transition-colors">
                                                    <Search className="h-5 w-5" />
                                                </div>
                                                <input
                                                    type="text"
                                                    placeholder="Nombre del alumno..."
                                                    className="w-full h-14 pl-12 pr-4 rounded-3xl border-2 border-slate-100 focus:border-[#004aad] outline-none font-bold text-slate-700 bg-slate-50"
                                                    value={searchTerm}
                                                    onChange={(e) => {
                                                        setSearchTerm(e.target.value);
                                                        setSelectedStudent(null);
                                                    }}
                                                />
                                                {searchTerm && !selectedStudent && (
                                                    <div className="absolute z-50 w-full mt-2 bg-white rounded-[28px] shadow-2xl border border-slate-100 max-h-48 overflow-y-auto">
                                                        {filteredEstudiantes.map(e => (
                                                            <button key={e.id} type="button" className="w-full text-left px-6 py-4 hover:bg-slate-50 font-bold border-b last:border-0" onClick={() => { setSelectedStudent(e); setSearchTerm(e.nombre); }}>
                                                                {e.nombre} ({e.grado})
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                            <input type="hidden" name="estudiante_id" value={selectedStudent?.id || ""} required />
                                            <input type="hidden" name="estado" value="saldado" />
                                            <input type="hidden" name="metodo" value="Efectivo" />
                                        </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label className="font-black text-xs uppercase text-slate-500 ml-2">Monto (RD$)</Label>
                                            <Input name="monto" type="number" step="0.01" required placeholder="6500" className="h-12 rounded-2xl" onChange={(e) => setMontoPorMes(parseFloat(e.target.value) || 0)} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="font-black text-xs uppercase text-slate-500 ml-2">Meses</Label>
                                            <select name="cantidad_meses" className="w-full h-12 px-4 rounded-2xl border-2 bg-slate-50 font-bold" value={cantidadMeses} onChange={(e) => setCantidadMeses(parseInt(e.target.value))}>
                                                {[1,2,3,4,5,6,7,8,9,10,12].map(n => <option key={n} value={n}>{n} {n === 1 ? 'mes' : 'meses'}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                    {montoPorMes > 0 && <div className="bg-blue-50 p-4 rounded-2xl flex justify-between items-center"><span className="font-black text-blue-800">TOTAL:</span><span className="text-xl font-black text-blue-900">RD$ {(montoPorMes * cantidadMeses).toLocaleString()}</span></div>}
                                </div>
                            )}

                            {activeModal === "evento" && (
                                <div className="space-y-4">
                                    <Input name="titulo" required placeholder="Título del Evento" className="h-12 rounded-2xl border-2 font-bold" />
                                    <div className="grid grid-cols-2 gap-4">
                                        <Input name="fecha" type="date" required className="h-12 rounded-2xl border-2 font-bold" />
                                        <Input name="locacion" placeholder="Lugar / Ubicación" className="h-12 rounded-2xl border-2 font-bold" />
                                    </div>
                                    <textarea 
                                        name="descripcion" 
                                        rows={3} 
                                        required 
                                        className="w-full p-4 rounded-3xl border-2 focus:border-[#004aad] outline-none font-medium bg-slate-50" 
                                        placeholder="Escribe los detalles del evento aquí (punto de encuentro, qué llevar, etc.)..."
                                    ></textarea>
                                </div>
                            )}

                            {activeModal === "comunicado" && (
                                <div className="space-y-4">
                                    <Input name="titulo" required placeholder="Título del Aviso" className="h-12 rounded-2xl border-2" />
                                    <textarea name="contenido" rows={4} required className="w-full p-4 rounded-3xl border-2 focus:border-[#8A2BE2] outline-none font-medium bg-slate-50" placeholder="Mensaje..."></textarea>
                                    <div className="grid grid-cols-3 gap-3">
                                        <button type="button" onClick={() => setPrioridadSelected("baja")} className={`p-4 rounded-3xl border-2 font-black text-[10px] uppercase tracking-tighter transition-all ${prioridadSelected === 'baja' ? 'bg-[#004aad] text-white border-[#004aad] shadow-lg shadow-blue-200' : 'bg-slate-50 border-slate-100 text-slate-400'}`}>Información</button>
                                        <button type="button" onClick={() => setPrioridadSelected("media")} className={`p-4 rounded-3xl border-2 font-black text-[10px] uppercase tracking-tighter transition-all ${prioridadSelected === 'media' ? 'bg-[#ffcc00] text-[#020617] border-[#ffcc00] shadow-lg shadow-amber-200' : 'bg-slate-50 border-slate-100 text-slate-400'}`}>Advertencia</button>
                                        <button type="button" onClick={() => setPrioridadSelected("alta")} className={`p-4 rounded-3xl border-2 font-black text-[10px] uppercase tracking-tighter transition-all ${prioridadSelected === 'alta' ? 'bg-[#ef4444] text-white border-[#ef4444] shadow-lg shadow-red-200' : 'bg-slate-50 border-slate-100 text-slate-400'}`}>Urgente</button>
                                    </div>
                                    <input type="hidden" name="prioridad" value={prioridadSelected} />
                                </div>
                            )}

                            {activeModal === "estudiante" && (
                                <div className="space-y-6">
                                    <div className="space-y-3">
                                        <Label className="font-black text-xs uppercase text-[#004aad] ml-1">Datos del Alumno</Label>
                                        <div className="grid grid-cols-2 gap-3">
                                            <Input name="nombre" required placeholder="Nombre Completo" className="h-12 rounded-2xl border-2" />
                                            <Input name="grado" required placeholder="Grado" className="h-12 rounded-2xl border-2" />
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="space-y-1">
                                                <Label className="text-[10px] font-bold text-slate-400 ml-2">FECHA DE NACIMIENTO</Label>
                                                <Input name="fecha_nacimiento" type="date" required className="h-12 rounded-2xl border-2 italic font-bold" />
                                            </div>
                                            <div className="space-y-1">
                                                <Label className="text-[10px] font-bold text-slate-400 ml-2">MENSUALIDAD (RD$)</Label>
                                                <Input name="cuota_mensual" type="number" required defaultValue="11000" placeholder="RD$ 0" className="h-12 rounded-2xl border-2 font-black" />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="pt-4 border-t border-slate-100 space-y-3">
                                        <Label className="font-black text-xs uppercase text-[#8A2BE2] ml-1">Padre / Tutor</Label>
                                        <select name="padre_id" className="w-full h-12 px-4 rounded-2xl border-2 border-purple-100 font-bold bg-white">
                                            <option value="">-- Vincular cuenta existente (opcional) --</option>
                                            {padres.map(p => <option key={p.id} value={p.id}>{p.nombre_completo || p.nombre}</option>)}
                                        </select>
                                        <Input name="tutor_email" type="email" placeholder="Email para acceso" className="h-12 rounded-2xl border-2 border-purple-100" />
                                        <div className="grid grid-cols-2 gap-3">
                                            <Input name="nombre_tutor" required placeholder="Nombre padre" className="h-12 rounded-2xl border-2" />
                                            <Input name="telefono_tutor" required placeholder="Teléfono" className="h-12 rounded-2xl border-2" />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeModal === "foto" && (
                                <div className="space-y-4">
                                    <Input name="titulo" required placeholder="Título del momento (ej: Fiesta de Disfraces)" className="h-12 rounded-2xl border-2 font-bold focus:ring-[#7ed957]" />
                                    <textarea 
                                        name="descripcion" 
                                        rows={3} 
                                        className="w-full p-4 rounded-3xl border-2 focus:border-[#ffcc00] outline-none font-medium bg-slate-50 transition-all focus:bg-white" 
                                        placeholder="Escribe aquí de qué trató la actividad (ej: Los niños compartieron sus cuentos favoritos...)"
                                    ></textarea>
                                    
                                    <Label className="font-black text-[10px] uppercase text-slate-400 ml-2 tracking-widest">Foto de la Actividad</Label>
                                    <label className="group cursor-pointer block">
                                        <div className="border-4 border-dashed border-slate-100 rounded-[35px] p-10 text-center flex flex-col items-center gap-4 transition-all hover:border-[#7ed957] hover:bg-green-50/30 group-active:scale-95">
                                            <div className="bg-slate-50 p-4 rounded-full text-slate-300 group-hover:text-[#7ed957] group-hover:bg-white transition-colors shadow-inner">
                                                <Plus className="h-8 w-8" />
                                            </div>
                                            <div className="space-y-1">
                                                <p className="font-black text-slate-500 uppercase text-xs tracking-tight">Haga clic aquí para subir una foto</p>
                                                <p className="text-[9px] font-bold text-slate-300 uppercase italic">Formato: JPG, PNG • Max: 5MB</p>
                                            </div>
                                            <input type="file" name="foto" required className="hidden" accept="image/*" />
                                        </div>
                                    </label>
                                </div>
                            )}

                            {activeModal === "agradecimiento" && (
                                <div className="space-y-4">
                                    <Input name="titulo" required placeholder="Para" className="h-12 rounded-2xl border-2" />
                                    <textarea name="contenido" rows={4} required className="w-full p-4 rounded-3xl border-2 bg-slate-50" placeholder="Mensaje..."></textarea>
                                </div>
                            )}

                            {activeModal === "pendientes" && (
                                <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                                    {usuariosPendientes.length === 0 ? (
                                        <div className="text-center py-12 text-slate-400">
                                            <Users className="h-12 w-12 mx-auto mb-3 opacity-20" />
                                            <p className="font-bold">No hay solicitudes pendientes.</p>
                                        </div>
                                    ) : (
                                        usuariosPendientes.map(user => (
                                            <div key={user.id} className="bg-slate-50 border border-slate-100 rounded-3xl p-5 flex flex-col sm:flex-row gap-4 items-center justify-between">
                                                <div>
                                                    <p className="font-black text-slate-800">{user.nombre_completo || "Sin nombre"}</p>
                                                    <p className="text-sm font-bold text-slate-500">ID Usuario: {user.nombre}</p>
                                                    <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase">
                                                        Solicitado: {new Date(user.created_at).toLocaleDateString('es-DO')}
                                                    </p>
                                                </div>
                                                <div className="flex gap-2 w-full sm:w-auto">
                                                    <Button
                                                        type="button"
                                                        onClick={async () => {
                                                            const f = new FormData();
                                                            f.append('parent_id', user.id);
                                                            await handleAction(rejectParentAction, f);
                                                        }}
                                                        className="flex-1 sm:flex-none rounded-2xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-black px-6"
                                                    >
                                                        Rechazar
                                                    </Button>
                                                    <Button
                                                        type="button"
                                                        onClick={async () => {
                                                            const f = new FormData();
                                                            f.append('parent_id', user.id);
                                                            await handleAction(approveParentAction, f);
                                                        }}
                                                        className="flex-1 sm:flex-none rounded-2xl bg-[#7ed957] hover:bg-[#6ec54a] text-[#020617] font-black px-6"
                                                    >
                                                        Aprobar
                                                    </Button>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            )}

                            {activeModal === "revisar_pagos" && (
                                <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                                    {pagosRevision.length === 0 ? (
                                        <div className="text-center py-12 text-slate-400">
                                            <CheckCircle className="h-12 w-12 mx-auto mb-3 opacity-20" />
                                            <p className="font-bold">No hay pagos pendientes de revisión.</p>
                                        </div>
                                    ) : (
                                        pagosRevision.map(pago => (
                                            <div key={pago.id} className="bg-slate-50 border border-slate-100 rounded-3xl p-5 flex flex-col gap-4">
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <p className="font-black text-slate-800">{pago.estudiantes?.nombre}</p>
                                                        <p className="text-sm font-bold text-[#004aad]">RD$ {pago.monto?.toLocaleString()}</p>
                                                        <p className="text-[10px] font-bold text-slate-400 uppercase">
                                                            Fecha: {new Date(pago.fecha + 'T12:00:00').toLocaleDateString('es-DO')}
                                                        </p>
                                                    </div>
                                                    <Badge className={pago.estado === 'saldado' ? 'bg-green-500' : 'bg-amber-500'}>
                                                        {pago.estado === 'en_revision' ? 'En Revisión' : pago.estado === 'saldado' ? 'Saldado' : 'Rechazado'}
                                                    </Badge>
                                                </div>

                                                {pago.url_comprobante && (
                                                    <div className="relative group rounded-2xl overflow-hidden border-2 border-slate-200">
                                                        <img src={pago.url_comprobante} alt="Comprobante" className="w-full aspect-video object-cover cursor-zoom-in" onClick={() => window.open(pago.url_comprobante, '_blank')} />
                                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity pointer-events-none">
                                                            <SearchIcon className="text-white h-8 w-8" />
                                                        </div>
                                                    </div>
                                                )}

                                                {pago.estado === 'en_revision' && (
                                                    <div className="flex gap-2 w-full">
                                                        <Button
                                                            type="button"
                                                            onClick={async () => {
                                                                setIsLoading(true);
                                                                const res = await rejectPaymentAction(pago.id);
                                                                setIsLoading(false);
                                                                if (res.error) alert(res.error);
                                                                else showToast("Pago rechazado");
                                                            }}
                                                            className="flex-1 rounded-2xl bg-rose-100 hover:bg-rose-200 text-rose-600 font-black h-12"
                                                        >
                                                            <XCircle className="mr-2 h-4 w-4" /> Rechazar
                                                        </Button>
                                                        <Button
                                                            type="button"
                                                            onClick={async () => {
                                                                setIsLoading(true);
                                                                const res = await approvePaymentAction(pago.id);
                                                                setIsLoading(false);
                                                                if (res.error) alert(res.error);
                                                                else showToast("Pago aprobado");
                                                            }}
                                                            className="flex-1 rounded-2xl bg-[#7ed957] hover:bg-[#6ec54a] text-[#020617] font-black h-12"
                                                        >
                                                            <CheckCircle className="mr-2 h-4 w-4" /> Aprobar
                                                        </Button>
                                                    </div>
                                                )}
                                            </div>
                                        ))
                                    )}
                                </div>
                            )}

                            {/* --- BOTONES --- */}
                            <div className="pt-4 flex gap-3 border-t border-slate-100">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    onClick={() => setActiveModal(null)}
                                    className={(activeModal === "pendientes" || activeModal === "revisar_pagos") ? "w-full h-14 rounded-2xl font-black text-slate-600 bg-slate-100 hover:bg-slate-200" : "flex-1 h-14 rounded-2xl font-black text-slate-400 hover:bg-slate-100"}
                                >
                                    {(activeModal === "pendientes" || activeModal === "revisar_pagos") ? "Cerrar Panel" : "Cancelar"}
                                </Button>
                                {(activeModal !== "pendientes" && activeModal !== "revisar_pagos") && (
                                    <Button
                                        type="submit"
                                        disabled={isLoading}
                                        className={`flex-[2] h-14 rounded-2xl font-black text-white shadow-xl ${
                                            activeModal === "pago" ? "bg-[#004aad]" :
                                            activeModal === "comunicado" ? "bg-[#8A2BE2]" :
                                            activeModal === "evento" ? "bg-[#FF8C00]" : "bg-[#7ed957] text-slate-900"
                                        }`}
                                    >
                                        {isLoading ? "Procesando..." : "Confirmar y Guardar"}
                                    </Button>
                                )}
                            </div>
                        </form>
                    </Card>
                </div>
            )}

            {/* Notificación Toast Custom */}
            {toast.visible && (
                <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[200] animate-in slide-in-from-bottom-5">
                    <div className="bg-[#020617] text-white px-8 py-4 rounded-full shadow-2xl flex items-center gap-3 border border-white/10">
                        <div className="h-6 w-6 bg-[#7ed957] rounded-full flex items-center justify-center">
                            <Plus className="h-4 w-4 text-black rotate-45" />
                        </div>
                        <span className="font-black text-sm tracking-tight">{toast.message}</span>
                    </div>
                </div>
            )}
        </>
    );
}