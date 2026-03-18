"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { addNotaAction, deleteNotaAction, addCalificacionAction, deleteCalificacionAction } from "@/app/actions/maestro";
import { LogoutButton } from "@/components/LogoutButton";
import { Send, FileEdit, Trash2, Clock } from "lucide-react";
import { Input } from "@/components/ui/input";

export interface Calificacion {
    id: string;
    estudiante_id: string;
    maestro_id: string;
    perfiles?: { nombre_completo: string };
    asignatura: string;
    nota_mes: number;
    nota_prueba: number;
    nota_final: number;
    comentario_especifico: string;
    periodo: string;
    created_at: string;
    estudiantes?: { nombre: string };
}

interface Evaluation {
    id: string;
    estudiante_id: string;
    maestro_id: string;
    maestro_nombre?: string;
    perfiles?: { nombre_completo: string };
    notas?: Record<string, string>;
    categoria: string;
    observaciones: string;
    fecha: string;
    created_at: string;
    estudiantes?: { nombre: string };
}

export function TeacherDashboardClient({ 
    estudiantes, 
    evaluaciones: initialEvaluaciones, 
    calificaciones: initialCalificaciones,
    maestroNombre 
}: { 
    estudiantes: { id: string, nombre: string, grado: string }[],
    evaluaciones: Evaluation[],
    calificaciones: Calificacion[],
    maestroNombre: string
}) {
    const [toast, setToast] = useState<{ message: string, visible: boolean }>({ message: "", visible: false });
    const [isLoading, setIsLoading] = useState(false);
    const [search, setSearch] = useState("");
    const [activeTab, setActiveTab] = useState<"notas" | "calificaciones">("calificaciones");
    
    // No necesitamos useActionState para delete, llamamos la acción directamente.

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
            showToast("¡Evaluación enviada con éxito! 🎉");
            (document.getElementById("eval-form") as HTMLFormElement).reset();
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

                <div className="flex gap-4 mb-8 bg-white p-2 rounded-2xl shadow-sm border border-slate-100 max-w-fit mx-auto">
                    <button onClick={() => setActiveTab("calificaciones")} className={`px-6 py-3 rounded-xl font-bold uppercase tracking-wider text-xs transition-all ${activeTab === 'calificaciones' ? 'bg-[#002147] text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}>Registro de Calificaciones</button>
                    <button onClick={() => setActiveTab("notas")} className={`px-6 py-3 rounded-xl font-bold uppercase tracking-wider text-xs transition-all ${activeTab === 'notas' ? 'bg-[#002147] text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}>Evaluación General</button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    {/* Columna Izquierda: Formulario (5 cols) */}
                    <div className="lg:col-span-12 xl:col-span-5">
                        <Card className="rounded-[40px] border-0 shadow-2xl bg-white sticky top-8">
                            <CardHeader className="pb-4 pt-8 px-8 border-b border-slate-50 mb-4">
                                <CardTitle className="text-2xl font-black text-slate-800 flex items-center gap-2">
                                    <FileEdit className="text-slate-800" /> {activeTab === "calificaciones" ? "Nuevas Calificaciones" : "Evaluación General"}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="px-8 pb-8 pt-4">
                                {activeTab === "notas" && (
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
                                        <Label className="font-black text-slate-700 text-sm uppercase tracking-widest">Categoría del Avance</Label>
                                        <select name="categoria" required className="flex w-full h-14 rounded-[24px] border-2 border-slate-200 bg-slate-50 px-6 font-bold shadow-inner focus:outline-none focus:border-slate-800 transition-all">
                                            <option value="">Seleccione...</option>
                                            <option value="Conducta">😇 Conducta</option>
                                            <option value="General">🌟 General</option>
                                            <option value="Tareas">📝 Tareas</option>
                                            <option value="Salud">🩺 Salud</option>
                                            <option value="Deportes">⚽ Deportes</option>
                                            <option value="Matemáticas">🔢 Matemáticas</option>
                                            <option value="Ciencias">🔬 Ciencias</option>
                                            <option value="Almuerzo">🍽️ Almuerzo</option>
                                            <option value="Desayuno">🥐 Desayuno</option>
                                            <option value="Meriendas">🥪 Meriendas</option>
                                            <option value="Avances">📈 Avances</option>
                                            <option value="Otros">📌 Otros</option>
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
                                        className="w-full bg-[#002147] hover:bg-slate-800 text-white h-16 rounded-[24px] text-lg font-black tracking-widest uppercase transition-all shadow-xl active:scale-[0.98]"
                                    >
                                        {isLoading ? "Enviando..." : "Guardar Evaluación"} <Send className="ml-2 h-5 w-5" />
                                    </Button>
                                </form>
                                )}

                                {activeTab === "calificaciones" && (
                                <form id="calif-form" action={async (formData) => {
                                        setIsLoading(true);
                                        const result = await addCalificacionAction(null, formData);
                                        setIsLoading(false);
                                        if (result?.error) alert("⚠️ ERROR: " + result.error);
                                        else { showToast("¡Calificación guardada!"); (document.getElementById("calif-form") as HTMLFormElement).reset(); }
                                    }} className="space-y-6">
                                    <div className="space-y-3">
                                        <Label className="font-black text-slate-700 text-sm uppercase tracking-widest">Alumno</Label>
                                        <select
                                            name="estudiante_id"
                                            required
                                            className="flex w-full h-14 rounded-[24px] border-2 border-slate-200 bg-slate-50 px-6 font-bold focus:outline-none focus:border-slate-800 transition-all cursor-pointer"
                                        >
                                            <option value="">Selecciona alumno...</option>
                                            {filteredEstudiantes.map(e => (
                                                <option key={e.id} value={e.id}>{e.nombre} — {e.grado}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-3">
                                            <Label className="font-black text-slate-700 text-sm uppercase tracking-widest">Periodo</Label>
                                            <Input type="text" name="periodo" placeholder="Ej. Ene-Mar 2026" required className="h-14 rounded-[24px]" />
                                        </div>
                                        <div className="space-y-3">
                                            <Label className="font-black text-slate-700 text-sm uppercase tracking-widest">Asignatura</Label>
                                            <select name="asignatura" required className="flex w-full h-14 rounded-[24px] border-2 border-slate-200 bg-slate-50 px-6 font-bold focus:outline-none focus:border-slate-800">
                                                <option value="">Selecciona...</option>
                                                {["Historia", "Lenguaje", "Matematicas", "Ciencias", "Arte", "Manualidades", "Tecnologia", "Robotica", "Etica", "Musica", "Canto", "Otros"].map(a => (
                                                    <option key={a} value={a}>{a}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-3 gap-3">
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-black uppercase text-[#002147] tracking-widest">Nota Mes</Label>
                                            <Input type="number" step="0.1" name="nota_mes" required className="h-12 rounded-[16px] text-center font-black" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-black uppercase text-[#002147] tracking-widest">Prueba</Label>
                                            <Input type="number" step="0.1" name="nota_prueba" required className="h-12 rounded-[16px] text-center font-black" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-black uppercase text-[#002147] tracking-widest">Final</Label>
                                            <Input type="number" step="0.1" name="nota_final" required className="h-12 rounded-[16px] text-center font-black" />
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <Label className="font-black text-slate-700 text-sm uppercase tracking-widest">Comentario</Label>
                                        <textarea
                                            name="comentario_especifico"
                                            rows={3}
                                            className="flex w-full rounded-[24px] border-2 border-slate-200 bg-slate-50 p-6 font-medium focus:border-slate-800 transition-all resize-none"
                                        ></textarea>
                                    </div>

                                    <Button
                                        type="submit"
                                        disabled={isLoading}
                                        className="w-full bg-[#002147] hover:bg-slate-800 text-white h-16 rounded-[24px] text-lg font-black tracking-widest uppercase transition-all shadow-xl active:scale-[0.98]"
                                    >
                                        {isLoading ? "Enviando..." : "Registrar Calificación"} <Send className="ml-2 h-5 w-5" />
                                    </Button>
                                </form>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Columna Derecha: Historial (7 cols) */}
                    <div className="lg:col-span-12 xl:col-span-7">
                        <div className="bg-slate-800/5 rounded-[40px] p-4 md:p-8">
                            <h2 className="text-2xl font-black text-slate-800 px-6 py-4 flex items-center gap-2 tracking-tighter shadow-sm mb-6 bg-white rounded-3xl w-fit">
                                <Clock className="text-[#002147]" /> {activeTab === "calificaciones" ? "Historial Numérico" : "Historial de Reportes"}
                            </h2>

                            <div className="space-y-6">
                                {activeTab === "notas" && (initialEvaluaciones.length > 0 ? initialEvaluaciones.map((ev: Evaluation) => (
                                    <div key={ev.id} className="bg-white p-8 rounded-[40px] shadow-lg border-2 border-white hover:border-[#002147]/10 transition-all group overflow-hidden relative">
                                        <div className="flex flex-col sm:flex-row gap-6 relative z-10 w-full">
                                            {/* Column Date */}
                                            <div className="flex-none bg-slate-50 border border-slate-100 p-4 rounded-[28px] text-center w-[120px] shadow-sm flex flex-col justify-center shrink-0">
                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest pb-1">Ingreso</span>
                                                <span className="text-xl font-black text-[#002147] capitalize leading-none mb-1">
                                                    {new Date(ev.created_at).toLocaleDateString("es-DO", { day: '2-digit', month: 'short' })}
                                                </span>
                                                <span className="text-xs font-bold text-slate-400 bg-white rounded-full py-1 px-2 border border-slate-100 mt-2">
                                                    {new Date(ev.created_at).getFullYear()}
                                                </span>
                                            </div>

                                            {/* Column Info */}
                                            <div className="flex-1 space-y-4">
                                                <div className="flex gap-2 justify-between items-start">
                                                    <div>
                                                        <h5 className="font-black text-slate-800 text-2xl tracking-tighter leading-tight break-words">{ev.estudiantes?.nombre}</h5>
                                                        <div className="inline-flex mt-2 items-center px-3 py-1 rounded-full bg-[#002147] text-white text-[10px] font-black tracking-widest uppercase truncate max-w-[200px]">
                                                            {ev.categoria}
                                                        </div>
                                                    </div>
                                                    <div className="flex-none">
                                                        <form action={async (formData) => {
                                                            const result = await deleteNotaAction(null, formData);
                                                            if (result?.error) alert(result.error);
                                                            else showToast("Eliminado con éxito");
                                                        }}>
                                                            <input type="hidden" name="id" value={ev.id} />
                                                            <button 
                                                                type="submit"
                                                                className="bg-red-50 hover:bg-red-100 text-red-600 p-3 rounded-2xl transition-all active:scale-95 group-hover:shadow-md shrink-0"
                                                            >
                                                                <Trash2 className="h-5 w-5" />
                                                            </button>
                                                        </form>
                                                    </div>
                                                </div>

                                                <div className="relative bg-slate-50 p-6 rounded-[28px] border border-slate-100">
                                                    <div className="absolute -left-2 -top-2 text-4xl text-slate-200 font-serif translate-y-2 opacity-50">“</div>
                                                    <p className="text-slate-600 font-bold italic text-base leading-relaxed relative z-10">
                                                        {ev.observaciones}
                                                    </p>
                                                    <div className="absolute right-4 bottom-2 text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-2">
                                                        ✍️ Maestro: {ev.perfiles?.nombre_completo || maestroNombre}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )) : <div className="bg-white rounded-[40px] p-20 text-center"><p className="text-slate-400 font-bold italic">Aún no hay reportes.</p></div>)}

                                {activeTab === "calificaciones" && (initialCalificaciones.length > 0 ? initialCalificaciones.map((cal: Calificacion) => (
                                    <div key={cal.id} className="bg-white p-6 rounded-[30px] shadow-lg border-l-8 border-l-[#002147] transition-all flex flex-col xl:flex-row gap-4">
                                        <div className="flex-1">
                                            <div className="flex justify-between items-start mb-4">
                                                <div className="pr-4">
                                                    <h5 className="font-black text-[#002147] text-xl uppercase tracking-tighter leading-none">{cal.estudiantes?.nombre}</h5>
                                                    <span className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1 inline-block">{cal.periodo} • {cal.asignatura}</span>
                                                </div>
                                                <form action={async (formData) => {
                                                            const result = await deleteCalificacionAction(null, formData);
                                                            if (result?.error) alert(result.error);
                                                            else showToast("Eliminado con éxito");
                                                        }}>
                                                    <input type="hidden" name="id" value={cal.id} />
                                                    <button type="submit" className="text-red-300 bg-red-50 rounded-xl hover:text-red-500 transition-colors p-2 shrink-0"><Trash2 className="h-4 w-4"/></button>
                                                </form>
                                            </div>
                                            
                                            {cal.comentario_especifico && (
                                                <p className="text-sm text-slate-600 font-medium italic bg-slate-50 border border-slate-100 rounded-2xl p-4 leading-relaxed line-clamp-2">"{cal.comentario_especifico}"</p>
                                            )}
                                        </div>

                                        <div className="xl:w-48 bg-slate-50 rounded-2xl p-4 border border-slate-100 flex xl:flex-col justify-around xl:justify-center items-center gap-2 lg:gap-4 shrink-0 mt-4 xl:mt-0">
                                            <div className="text-center w-full">
                                                <div className="text-[9px] font-black uppercase text-slate-400 tracking-wider">MES</div>
                                                <div className="text-xl font-black text-[#002147]">{cal.nota_mes}</div>
                                            </div>
                                            <div className="h-8 w-px xl:w-full xl:h-px bg-slate-200"></div>
                                            <div className="text-center w-full">
                                                <div className="text-[9px] font-black uppercase text-slate-400 tracking-wider">PRUEBA</div>
                                                <div className="text-xl font-black text-[#002147]">{cal.nota_prueba}</div>
                                            </div>
                                            <div className="h-8 w-px xl:w-full xl:h-px bg-slate-200"></div>
                                            <div className="text-center w-full">
                                                <div className="text-[9px] font-black uppercase text-slate-400 tracking-wider">FINAL</div>
                                                <div className="text-2xl font-black text-green-600 bg-green-50 rounded-xl">{cal.nota_final}</div>
                                            </div>
                                        </div>
                                    </div>
                                )) : <div className="bg-white rounded-[40px] p-20 text-center"><p className="text-slate-400 font-bold italic">Aún no hay calificaciones.</p></div>)}
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
