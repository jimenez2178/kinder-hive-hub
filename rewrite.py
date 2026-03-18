import re

with open('src/app/maestro/components/TeacherDashboardClient.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Make the changes in memory and write output
# 1. Imports
content = content.replace('import { addNotaAction, deleteNotaAction } from "@/app/actions/maestro";',
    'import { addNotaAction, deleteNotaAction, addCalificacionAction, deleteCalificacionAction } from "@/app/actions/maestro";')

# 2. Interfaces
calificacion_iface = '''
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
'''
content = content.replace('export function TeacherDashboardClient', calificacion_iface + '\nexport function TeacherDashboardClient')

content = content.replace('evaluaciones: Evaluation[],', 'evaluaciones: Evaluation[],\\n    calificaciones: Calificacion[],')
content = content.replace('evaluaciones: initialEvaluaciones,', 'evaluaciones: initialEvaluaciones,\\n    calificaciones: initialCalificaciones,')

# 3. State
state_str = '''    const [toast, setToast] = useState<{ message: string, visible: boolean }>({ message: "", visible: false });
    const [isLoading, setIsLoading] = useState(false);
    const [search, setSearch] = useState("");
    const [activeTab, setActiveTab] = useState<"notas" | "calificaciones">("calificaciones");'''
content = content.replace('const [toast, setToast] = useState<{ message: string, visible: boolean }>({ message: "", visible: false });\\n    const [isLoading, setIsLoading] = useState(false);\\n    const [search, setSearch] = useState("");', state_str)

# 4. Toggle UI 
header_replace = r'''
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-20 -mt-20"></div>
                </header>
'''
toggle_ui = '''
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-20 -mt-20"></div>
                </header>

                <div className="flex gap-4 mb-8 bg-white p-2 rounded-2xl shadow-sm border border-slate-100 max-w-fit mx-auto">
                    <button onClick={() => setActiveTab("calificaciones")} className={px-6 py-3 rounded-xl font-bold uppercase tracking-wider text-xs transition-all }>Registro de Calificaciones</button>
                    <button onClick={() => setActiveTab("notas")} className={px-6 py-3 rounded-xl font-bold uppercase tracking-wider text-xs transition-all }>Evaluación General</button>
                </div>
'''
content = content.replace(header_replace.strip(), toggle_ui.strip())

# 5. Form Logic
form_start_index = content.find('<div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">')
tabs_content = '''
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    {/* Columna Izquierda: Formulario (7 cols) */}
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
                                                placeholder="?? Buscar alumno o grado..."
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
                                            <option value="Conducta">?? Conducta</option>
                                            <option value="General">?? General</option>
                                            <option value="Tareas">?? Tareas</option>
                                            <option value="Salud">?? Salud</option>
                                            <option value="Deportes">? Deportes</option>
                                            <option value="Matemáticas">?? Matemáticas</option>
                                            <option value="Ciencias">?? Ciencias</option>
                                            <option value="Almuerzo">??? Almuerzo</option>
                                            <option value="Desayuno">?? Desayuno</option>
                                            <option value="Meriendas">?? Meriendas</option>
                                            <option value="Avances">?? Avances</option>
                                            <option value="Otros">?? Otros</option>
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
                                        if (result?.error) alert("?? ERROR: " + result.error);
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
                                            <Label className="text-xs font-black uppercase tracking-widest">Nota Mes</Label>
                                            <Input type="number" step="0.1" name="nota_mes" required className="h-12 rounded-[16px] text-center" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-xs font-black uppercase tracking-widest">Prueba</Label>
                                            <Input type="number" step="0.1" name="nota_prueba" required className="h-12 rounded-[16px] text-center" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-xs font-black uppercase tracking-widest">Final</Label>
                                            <Input type="number" step="0.1" name="nota_final" required className="h-12 rounded-[16px] text-center" />
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <Label className="font-black text-slate-700 text-sm uppercase tracking-widest">Comentario</Label>
                                        <textarea
                                            name="comentario_especifico"
                                            rows={2}
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
                        <div className="bg-slate-800/5 rounded-[40px] p-2 md:p-8">
                            <h2 className="text-2xl font-black text-slate-800 px-6 py-4 flex items-center gap-2 tracking-tighter shadow-sm mb-6 bg-white rounded-3xl w-fit">
                                <Clock className="text-[#002147]" /> {activeTab === "calificaciones" ? "Historial Numérico" : "Historial de Reportes"}
                            </h2>

                            <div className="space-y-6">
                                {activeTab === "notas" && (initialEvaluaciones.length > 0 ? initialEvaluaciones.map((ev: Evaluation) => (
                                    <div key={ev.id} className="bg-white p-8 rounded-[40px] shadow-lg border-2 border-white hover:border-[#002147]/10 transition-all group overflow-hidden relative">
                                        {/* Historial Evaluacion HTML */}
                                        <div className="flex flex-col sm:flex-row gap-6 relative z-10 w-full">
                                            <div className="bg-slate-50 border border-slate-100 p-4 rounded-[28px] text-center min-w-[120px] shadow-sm flex flex-col justify-center">
                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest pb-1">Ingreso</span>
                                                <span className="text-xl font-black text-[#002147] capitalize leading-none mb-1">
                                                    {new Date(ev.created_at).toLocaleDateString("es-DO", { day: '2-digit', month: 'short' })}
                                                </span>
                                                <span className="text-xs font-bold text-slate-400 bg-white rounded-full py-1 px-2 border border-slate-100 mt-2">
                                                    {new Date(ev.created_at).getFullYear()}
                                                </span>
                                            </div>

                                            <div className="flex-1 space-y-4 max-w-[calc(100%-144px)]">
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <h5 className="font-black text-slate-800 text-2xl tracking-tighter leading-tight break-words">{ev.estudiantes?.nombre}</h5>
                                                        <div className="inline-flex mt-2 items-center px-3 py-1 rounded-full bg-[#002147] text-white text-[10px] font-black tracking-widest uppercase">
                                                            {ev.categoria}
                                                        </div>
                                                    </div>
                                                    <form action={async (formData) => {
                                                        const result = await deleteFormAction(formData);
                                                        if (result?.error) alert(result.error);
                                                        else showToast("Eliminado con éxito");
                                                    }}>
                                                        <input type="hidden" name="id" value={ev.id} />
                                                        <button 
                                                            type="submit"
                                                            className="bg-red-50 hover:bg-red-100 text-red-600 p-3 rounded-2xl transition-all active:scale-95 group-hover:shadow-md"
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
                                                    <div className="absolute right-4 bottom-2 text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-2">
                                                        ?? Maestro: {ev.perfiles?.nombre_completo || maestroNombre}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )) : <div className="bg-white rounded-[40px] p-20 text-center"><p className="text-slate-400 font-bold italic">Aún no hay reportes.</p></div>)}

                                {activeTab === "calificaciones" && (initialCalificaciones.length > 0 ? initialCalificaciones.map((cal: Calificacion) => (
                                    <div key={cal.id} className="bg-white p-6 rounded-[30px] shadow-lg border-l-8 border-l-[#002147] transition-all">
                                        <div className="flex justify-between items-center mb-4">
                                            <div>
                                                <h5 className="font-black text-[#002147] text-xl uppercase tracking-tighter">{cal.estudiantes?.nombre}</h5>
                                                <span className="text-slate-400 text-xs font-bold uppercase">{cal.periodo} • {cal.asignatura}</span>
                                            </div>
                                            <form action={async (formData) => {
                                                        const result = await deleteCalificacionAction(null, formData);
                                                        if (result?.error) alert(result.error);
                                                        else showToast("Eliminado con éxito");
                                                    }}>
                                                <input type="hidden" name="id" value={cal.id} />
                                                <button type="submit" className="text-red-300 hover:text-red-500 transition-colors p-2"><Trash2 className="h-4 w-4"/></button>
                                            </form>
                                        </div>
                                        <div className="grid grid-cols-3 gap-2 bg-slate-50 rounded-2xl p-4 border border-slate-100 mb-3">
                                            <div className="text-center">
                                                <div className="text-[10px] font-black uppercase text-slate-400 tracking-wider">MES</div>
                                                <div className="text-lg font-black text-[#002147]">{cal.nota_mes}</div>
                                            </div>
                                            <div className="text-center border-l border-r border-slate-200">
                                                <div className="text-[10px] font-black uppercase text-slate-400 tracking-wider">PRUEBA</div>
                                                <div className="text-lg font-black text-[#002147]">{cal.nota_prueba}</div>
                                            </div>
                                            <div className="text-center">
                                                <div className="text-[10px] font-black uppercase text-slate-400 tracking-wider">FINAL</div>
                                                <div className="text-lg font-black text-green-600">{cal.nota_final}</div>
                                            </div>
                                        </div>
                                        {cal.comentario_especifico && (
                                            <p className="text-xs text-slate-500 italic bg-white border border-slate-100 rounded-xl p-3">{cal.comentario_especifico}</p>
                                        )}
                                    </div>
                                )) : <div className="bg-white rounded-[40px] p-20 text-center"><p className="text-slate-400 font-bold italic">Aún no hay calificaciones.</p></div>)}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {toast.visible && (
'''

full_end = content[content.find('{toast.visible && ('):]

final_content = content[:form_start_index] + tabs_content + full_end

with open('src/app/maestro/components/TeacherDashboardClient.tsx', 'w', encoding='utf-8') as f:
    f.write(final_content)
