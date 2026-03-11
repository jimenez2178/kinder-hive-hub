"use client";

import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { addNotaAction } from "@/app/actions/maestro";
import { LogoutButton } from "@/components/LogoutButton";
import { Send, FileEdit } from "lucide-react";
import { Input } from "@/components/ui/input"; // Added Input import

export function TeacherDashboardClient({ estudiantes }: { estudiantes: { id: string, nombre: string, grado: string }[] }) {
    const [toast, setToast] = useState<{ message: string, visible: boolean }>({ message: "", visible: false });
    const [isLoading, setIsLoading] = useState(false);
    const [search, setSearch] = useState("");

    const showToast = (message: string) => {
        setToast({ message, visible: true });
        setTimeout(() => setToast({ message: "", visible: false }), 4000);
    };

    // Deducplicar estudiantes por ID (para evitar lo que vimos en la captura)
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
            // Manejo de error con instrucción clara
            alert("⚠️ ERROR DE SISTEMA: No se pudo guardar.\n\n" +
                "Causa: " + result.error + "\n\n" +
                "PASO PARA EL TÉCNICO:\n" +
                "Por favor, ve al SQL Editor de Supabase y pega esto:\n\n" +
                "ALTER TABLE evaluaciones ADD COLUMN IF NOT EXISTS fecha DATE DEFAULT CURRENT_DATE;\n" +
                "ALTER TABLE evaluaciones ADD COLUMN IF NOT EXISTS maestro_nombre TEXT;");
        } else {
            showToast("✨ ¡Evaluación guardada con éxito!");
            setSearch(""); // Limpiar búsqueda

            // Forzar limpieza de campos del formulario
            const form = document.getElementById('eval-form') as HTMLFormElement;
            if (form) form.reset();
        }
    };

    return (
        <>
            <div className="container mx-auto max-w-6xl pt-8 px-4 sm:px-6">
                {/* Header Section - Vibrant Gradient Banner (Purple Theme) */}
                <header className="bg-gradient-to-r from-[#004aad] to-[#8A2BE2] rounded-[32px] p-8 mb-10 text-white shadow-2xl shadow-[#004aad]/20 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
                    <div className="flex items-center gap-5 z-10">
                        <div className="bg-white p-1 rounded-2xl shadow-lg border-2 border-white">
                            <img
                                src="https://informativolatelefonica.com/wp-content/uploads/2026/03/LOGO.png"
                                alt="Logo Sagrada Familia"
                                className="h-16 w-16 object-contain"
                            />
                        </div>
                        <div>
                            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white drop-shadow-sm flex items-center gap-3">
                                Portal Académico 📝
                            </h1>
                            <p className="text-white/90 mt-1 font-medium text-lg">
                                Pre-escolar Psicopedagógico de la Sagrada Familia
                            </p>
                        </div>
                    </div>

                    <div className="z-10 bg-white/10 p-2 rounded-[32px] backdrop-blur-md">
                        <LogoutButton />
                    </div>

                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
                </header>

                {/* Dashboard Content - Formulario de Evaluación */}
                <div className="max-w-3xl mx-auto">
                    <Card className="rounded-[32px] border-0 shadow-2xl shadow-[#004aad]/10 bg-white">
                        <CardHeader className="pb-4 pt-8 px-8 border-b border-slate-100 mb-4">
                            <CardTitle className="text-2xl font-extrabold text-slate-800 flex items-center gap-2">
                                <FileEdit className="text-[#004aad]" fill="currentColor" /> Nueva Evaluación
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="px-8 pb-8 pt-4">
                            <form id="eval-form" action={handleSubtmit} className="space-y-6">
                                {/* Estudiante Selection - SMART SEARCH */}
                                <div className="space-y-3">
                                    <Label className="font-extrabold text-slate-700 text-base">¿A quién evaluamos hoy?</Label>
                                    <div className="relative group">
                                        <div className="relative">
                                            <Input
                                                type="text"
                                                id="search-input"
                                                placeholder="🔍 Escribe nombre o grado..."
                                                value={search}
                                                autoComplete="off"
                                                onChange={(e) => setSearch(e.target.value)}
                                                className="h-14 rounded-t-[32px] border-2 border-b-0 border-slate-200 bg-white px-6 font-bold focus:ring-0 focus:border-[#8A2BE2] transition-colors"
                                            />
                                            {search && (
                                                <button
                                                    onClick={() => setSearch("")}
                                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black bg-slate-100 p-2 rounded-full text-slate-400 hover:bg-slate-200 transition-colors uppercase tracking-widest"
                                                >
                                                    Limpiar
                                                </button>
                                            )}
                                        </div>
                                        <select
                                            name="estudiante_id"
                                            required
                                            size={filteredEstudiantes.length > 0 ? Math.min(filteredEstudiantes.length, 5) : 2}
                                            className="flex w-full overflow-y-auto rounded-b-[32px] border-2 border-t-0 border-slate-200 bg-slate-50 px-2 py-2 text-base text-slate-700 font-semibold shadow-inner focus:outline-none focus:border-[#8A2BE2] transition-all"
                                        >
                                            {filteredEstudiantes.length > 0 ? (
                                                filteredEstudiantes.map(e => (
                                                    <option key={e.id} value={e.id} className="p-3 my-1 rounded-2xl checked:bg-[#8A2BE2] checked:text-white hover:bg-[#8A2BE2]/10 cursor-pointer transition-colors">
                                                        {e.nombre} — {e.grado}
                                                    </option>
                                                ))
                                            ) : (
                                                <option disabled className="p-3 text-slate-400 italic">No se encontraron resultados...</option>
                                            )}
                                        </select>
                                    </div>
                                    <p className="text-[10px] font-bold text-slate-400 italic px-4">Utiliza el buscador para encontrar al alumno rápidamente.</p>
                                </div>

                                {/* Categoría Selection */}
                                <div className="space-y-3">
                                    <Label className="font-extrabold text-slate-700 text-base">Categoría a Evaluar</Label>
                                    <select name="categoria" required className="flex w-full h-14 items-center justify-between rounded-[32px] border-2 border-slate-200 bg-slate-50 px-6 py-2 text-base text-slate-700 font-semibold shadow-inner focus:outline-none focus:ring-4 focus:ring-[#004aad]/50 focus:border-[#004aad] transition-all">
                                        <option value="">Seleccione Categoría...</option>
                                        <option value="Lectura">📖 Lectura y Comprensión</option>
                                        <option value="Motricidad">🎨 Motricidad Fina/Gruesa</option>
                                        <option value="Atencion">🎯 Atención y Concentración</option>
                                        <option value="Conducta">😇 Conducta y Socialización</option>
                                        <option value="General">🌟 Desarrollo General</option>
                                        <option value="Deporte">🏅 Deportes y Actividad Física</option>
                                        <option value="Tareas">📝 Cumplimiento de Tareas</option>
                                        <option value="Compromiso">🤝 Nivel de Compromiso</option>
                                    </select>
                                </div>

                                {/* Observaciones Textarea */}
                                <div className="space-y-3">
                                    <Label className="font-extrabold text-slate-700 text-base">Reporte de Observaciones</Label>
                                    <textarea
                                        name="observaciones"
                                        id="obs-field"
                                        required
                                        rows={6}
                                        placeholder="Escriba los detalles del progreso o aspectos a mejorar..."
                                        className="flex w-full rounded-[32px] border-2 border-slate-200 bg-slate-50 p-6 text-base text-slate-700 font-medium shadow-inner focus:outline-none focus:ring-4 focus:ring-[#8A2BE2]/50 focus:border-[#8A2BE2] transition-all resize-none"
                                    ></textarea>
                                </div>

                                {/* Botón Enviar */}
                                <Button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full h-14 rounded-[32px] bg-[#8A2BE2] hover:bg-[#6e22b5] text-white font-extrabold text-lg shadow-xl shadow-[#8A2BE2]/30 mt-8 transition-transform hover:-translate-y-1 active:translate-y-0"
                                >
                                    {isLoading ? "Enviando Reporte..." : (
                                        <>
                                            <Send className="mr-2 h-6 w-6" fill="currentColor" /> Guardar Evaluación
                                        </>
                                    )}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* --- TOAST CONFIRMACIÓN --- */}
            {toast.visible && (
                <div className="fixed bottom-6 right-6 bg-[#FF1493] text-white font-extrabold px-6 py-4 rounded-[32px] shadow-2xl shadow-[#FF1493]/40 flex items-center gap-3 animate-in slide-in-from-bottom-5 duration-300 z-50 text-base">
                    <span className="text-2xl">✅</span>
                    {toast.message}
                </div>
            )}
        </>
    );
}
