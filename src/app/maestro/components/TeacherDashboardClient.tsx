"use client";

import { useActionState, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { addNotaAction, deleteNotaAction } from "@/app/actions/maestro";
import { LogoutButton } from "@/components/LogoutButton";
import { Send, FileEdit, Trash2, User, GraduationCap, Clock } from "lucide-react";
import { Input } from "@/components/ui/input";

interface Evaluation {
    id: string;
    estudiante_id: string;
    maestro_id: string;
    maestro_nombre: string;
    categoria: string;
    observaciones: string;
    fecha: string;
    created_at: string;
    estudiantes?: { nombre: string };
}

export function TeacherDashboardClient({ 
    estudiantes, 
    evaluaciones: initialEvaluaciones, 
    maestroNombre 
}: { 
    estudiantes: { id: string, nombre: string, grado: string }[],
    evaluaciones: Evaluation[],
    maestroNombre: string
}) {
    const [toast, setToast] = useState<{ message: string, visible: boolean }>({ message: "", visible: false });
    const [isLoading, setIsLoading] = useState(false);
    const [search, setSearch] = useState("");
    
    const [deleteState, deleteFormAction] = useActionState(deleteNotaAction, null);

    const showToast = (message: string) => {
        setToast({ message, visible: true });
        setTimeout(() => setToast({ message: "", visible: false }), 4000);
    };

    const uniqueEstudiantes = Array.from(new Map(estudiantes.map(item => [item.id, item])).values());

    const filteredEstudiantes = uniqueEstudiantes.filter(e =>
        e.nombre.toLowerCase().includes(search.toLowerCase()) ||
        e.grado.toLowerCase().includes(search.toLowerCase())
    );

    const handleSubtmit = async (formData: FormData) => {
        setIsLoading(true);
        const result = await addNotaAction(null, formData);
        setIsLoading(false);

        if (result?.error) {
            alert("⚠️ ERROR: " + result.error);
        } else {
            showToast("✨ ¡Evaluación guardada con éxito!");
            setSearch("");
            const form = document.getElementById('eval-form') as HTMLFormElement;
            if (form) form.reset();
        }
    };

    return (
        <>
            <div className="container mx-auto max-w-6xl pt-8 px-4 sm:px-6">
                {/* Header Section - Oxford Blue Theme */}
                <header className="bg-gradient-to-r from-[#002147] to-[#001025] rounded-[32px] p-8 mb-10 text-white shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
                    <div className="flex items-center gap-5 z-10">
                        <div className="bg-white p-2 rounded-2xl shadow-lg border-2 border-white">
                            <img
                                src="https://informativolatelefonica.com/wp-content/uploads/2026/03/LOGO.png"
                                alt="Logo Sagrada Familia"
                                className="h-16 w-16 object-contain"
                            />
                        </div>
                        <div>
                            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white drop-shadow-lg flex items-center gap-3 italic">
                                Panel del Maestro 🎓
                            </h1>
                            <p className="text-blue-100/70 mt-1 font-bold text-sm uppercase tracking-wider">
                                {maestroNombre} • Sagrada Familia
                            </p>
                        </div>
                    </div>

                    <div className="z-10 bg-white/10 p-2 rounded-[32px] backdrop-blur-md border border-white/10">
                        <LogoutButton />
                    </div>

                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-20 -mt-20"></div>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    {/* Columna Izquierda: Formulario (7 cols) */}
                    <div className="lg:col-span-12 xl:col-span-5">
                        <Card className="rounded-[40px] border-0 shadow-2xl bg-white sticky top-8">
                            <CardHeader className="pb-4 pt-8 px-8 border-b border-slate-50 mb-4">
                                <CardTitle className="text-2xl font-black text-slate-800 flex items-center gap-2">
                                    <FileEdit className="text-slate-800" /> Nueva Evaluación
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="px-8 pb-8 pt-4">
                                <form id="eval-form" action={handleSubtmit} className="space-y-6">
                                    <div className="space-y-3">
                                        <Label className="font-black text-slate-700 text-sm uppercase tracking-widest">¿A quién evaluamos?</Label>
                                        <div className="relative group">
                                            <Input
                                                type="text"
                                                placeholder="🔍 Buscar alumno o grado..."
                                                value={search}
                                                autoComplete="off"
                                                onChange={(e) => setSearch(e.target.value)}
                                                className="h-14 rounded-t-[24px] border-2 border-slate-200 bg-white px-6 font-bold focus:border-slate-800 transition-colors"
                                            />
                                            <select
                                                name="estudiante_id"
                                                required
                                                size={5}
                                                className="flex w-full overflow-y-auto rounded-b-[24px] border-2 border-t-0 border-slate-200 bg-slate-50 px-2 py-2 text-sm text-slate-700 font-bold shadow-inner focus:outline-none focus:border-slate-800 transition-all cursor-pointer"
                                            >
                                                {filteredEstudiantes.map(e => (
                                                    <option key={e.id} value={e.id} className="p-3 my-1 rounded-xl checked:bg-slate-800 checked:text-white hover:bg-slate-100 transition-colors">
                                                        {e.nombre} — {e.grado}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <Label className="font-black text-slate-700 text-sm uppercase tracking-widest">Categoría</Label>
                                        <select name="categoria" required className="flex w-full h-14 rounded-[24px] border-2 border-slate-200 bg-slate-50 px-6 font-bold shadow-inner focus:outline-none focus:border-slate-800 transition-all">
                                            <option value="">Seleccione...</option>
                                            <option value="Lectura">📖 Lectura y Comprensión</option>
                                            <option value="Motricidad">🎨 Motricidad</option>
                                            <option value="Atencion">🎯 Atención</option>
                                            <option value="Conducta">😇 Conducta</option>
                                            <option value="General">🌟 General</option>
                                            <option value="Tareas">📝 Tareas</option>
                                        </select>
                                    </div>

                                    <div className="space-y-3">
                                        <Label className="font-black text-slate-700 text-sm uppercase tracking-widest">Comentario Académico</Label>
                                        <textarea
                                            name="observaciones"
                                            required
                                            rows={4}
                                            placeholder="Detalles sobre el progreso del alumno..."
                                            className="flex w-full rounded-[24px] border-2 border-slate-200 bg-slate-50 p-6 font-medium shadow-inner focus:outline-none focus:border-slate-800 transition-all resize-none"
                                        ></textarea>
                                    </div>

                                    <Button
                                        type="submit"
                                        disabled={isLoading}
                                        className="w-full h-14 rounded-[24px] bg-slate-900 hover:bg-black text-white font-black text-lg shadow-xl mt-4 transition-transform hover:-translate-y-1 active:translate-y-0"
                                    >
                                        {isLoading ? "Enviando..." : (
                                            <>
                                                <Send className="mr-2 h-5 w-5" /> Guardar Evaluación
                                            </>
                                        )}
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Columna Derecha: Historial Reubicado (5 cols) */}
                    <div className="lg:col-span-12 xl:col-span-7">
                        <div className="space-y-6">
                            <div className="flex items-center justify-between px-2">
                                <h3 className="text-2xl font-black text-slate-800 flex items-center gap-3">
                                    <span className="bg-slate-100 p-2 rounded-2xl">
                                        <GraduationCap className="h-6 w-6 text-slate-800" />
                                    </span>
                                    Mis Comentarios Recientes
                                </h3>
                                <div className="bg-white px-4 py-1.5 rounded-full border shadow-sm text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                    {initialEvaluaciones.length} Registros
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-6">
                                {initialEvaluaciones.length > 0 ? initialEvaluaciones.map((ev) => (
                                    <div key={ev.id} className="bg-white rounded-[40px] p-8 shadow-xl border-2 border-slate-50 relative overflow-hidden group hover:border-slate-200 transition-all duration-300">
                                        <div className="relative z-10">
                                            <div className="flex items-start justify-between mb-6">
                                                <div className="flex items-center gap-4">
                                                    <div className="bg-slate-100 h-14 w-14 rounded-[20px] flex items-center justify-center">
                                                        <User className="h-6 w-6 text-slate-400" />
                                                    </div>
                                                    <div>
                                                        <h5 className="font-black text-slate-800 text-lg leading-tight uppercase tracking-tighter italic">{ev.estudiantes?.nombre}</h5>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <span className="bg-slate-800 text-white text-[9px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-widest">{ev.categoria}</span>
                                                            <span className="text-slate-300 text-[10px] items-center flex gap-1 font-bold">
                                                                <Clock className="h-3 w-3" /> {new Date(ev.created_at).toLocaleDateString('es-DO')}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                                
                                                <form action={deleteFormAction}>
                                                    <input type="hidden" name="id" value={ev.id} />
                                                    <button 
                                                        type="submit"
                                                        className="bg-red-50 hover:bg-red-100 text-red-600 p-3 rounded-2xl transition-all active:scale-95 group-hover:shadow-md"
                                                        title="Eliminar Comentario"
                                                    >
                                                        <Trash2 className="h-5 w-5" />
                                                    </button>
                                                </form>
                                            </div>

                                            <div className="relative bg-slate-50 p-6 rounded-[28px] border border-slate-100">
                                                <div className="absolute -left-2 -top-2 text-4xl text-slate-200 font-serif translate-y-2 opacity-50">“</div>
                                                <p className="text-slate-600 font-bold italic text-base leading-relaxed relative z-10">
                                                    {ev.observaciones}
                                                </p>
                                                <div className="absolute right-4 bottom-0 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                                    ✍️ Maestro: {ev.maestro_nombre}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )) : (
                                    <div className="bg-white rounded-[40px] border-4 border-dashed border-slate-100 p-20 text-center">
                                        <FileEdit className="h-12 w-12 text-slate-200 mx-auto mb-4" />
                                        <p className="text-slate-400 font-bold italic">Aún no has registrado evaluaciones académicas.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {toast.visible && (
                <div className="fixed bottom-6 right-6 bg-slate-900 text-white font-extrabold px-8 py-5 rounded-[24px] shadow-2xl flex items-center gap-4 animate-in slide-in-from-bottom-5 duration-300 z-50">
                    <span className="bg-white/20 p-2 rounded-full">✅</span>
                    {toast.message}
                </div>
            )}
        </>
    );
}
