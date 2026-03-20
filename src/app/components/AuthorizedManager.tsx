"use client";

import React, { useState, useEffect } from "react";
import { 
    UserPlus, 
    Trash2, 
    ShieldCheck, 
    Camera, 
    Upload, 
    User, 
    IdCard, 
    Heart,
    Loader2,
    X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { addAuthorizedAction, deleteAuthorizedAction, getAuthorizedByStudentAction } from "@/app/actions/autorizaciones";

interface Authorized {
    id: string;
    nombre_sustituto: string;
    cedula: string;
    parentesco: string;
    foto_url: string;
    alumno_id: string;
}

interface AuthorizedManagerProps {
    estudiantes: any[];
}

export default function AuthorizedManager({ estudiantes }: AuthorizedManagerProps) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [authorizedList, setAuthorizedList] = useState<Authorized[]>([]);
    const [selectedAlumno, setSelectedAlumno] = useState(estudiantes[0]?.id || "");
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [compressedFile, setCompressedFile] = useState<File | null>(null);

    useEffect(() => {
        if (selectedAlumno) {
            loadAuthorized();
        }
    }, [selectedAlumno]);

    async function loadAuthorized() {
        setIsLoading(true);
        const res = await getAuthorizedByStudentAction(selectedAlumno);
        if (res.data) setAuthorizedList(res.data);
        setIsLoading(false);
    }

    const compressImage = (file: File): Promise<File> => {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (event) => {
                const img = new Image();
                img.src = event.target?.result as string;
                img.onload = () => {
                    const canvas = document.createElement("canvas");
                    const MAX_WIDTH = 800;
                    const MAX_HEIGHT = 800;
                    let width = img.width;
                    let height = img.height;

                    if (width > height) {
                        if (width > MAX_WIDTH) {
                            height *= MAX_WIDTH / width;
                            width = MAX_WIDTH;
                        }
                    } else {
                        if (height > MAX_HEIGHT) {
                            width *= MAX_HEIGHT / height;
                            height = MAX_HEIGHT;
                        }
                    }

                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext("2d");
                    ctx?.drawImage(img, 0, 0, width, height);
                    
                    canvas.toBlob((blob) => {
                        if (blob) {
                            const newFile = new File([blob], file.name, {
                                type: "image/jpeg",
                                lastModified: Date.now(),
                            });
                            resolve(newFile);
                        }
                    }, "image/jpeg", 0.7); // 70% quality
                };
            };
        });
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const compressed = await compressImage(file);
            setCompressedFile(compressed);
            setPreviewUrl(URL.createObjectURL(compressed));
        }
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);
        const formData = new FormData(e.currentTarget);
        if (compressedFile) {
            formData.set("foto", compressedFile);
        }
        formData.set("alumno_id", selectedAlumno);

        const res = await addAuthorizedAction(formData);
        setIsLoading(false);
        if (res.error) {
            alert(res.error);
        } else {
            setIsModalOpen(false);
            setPreviewUrl(null);
            setCompressedFile(null);
            loadAuthorized();
        }
    };

    const handleDelete = async (auth: Authorized) => {
        if (!confirm("¿Seguro que deseas eliminar esta autorización?")) return;
        setIsLoading(true);
        // Extraer path del storage de la URL pública
        // URL format: .../storage/v1/object/public/autorizaciones/[user_id]/[filename]
        const pathParts = auth.foto_url.split('/autorizaciones/').pop()?.split('?')[0];
        const res = await deleteAuthorizedAction(auth.id, pathParts);
        setIsLoading(false);
        if (res.error) alert(res.error);
        else loadAuthorized();
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h3 className="text-2xl font-black text-slate-800 italic uppercase tracking-tighter flex items-center gap-3">
                        <ShieldCheck className="h-7 w-7 text-[#8A2BE2]" />
                        Autorizaciones de Recogida
                    </h3>
                    <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-1">Personas autorizadas para retirar alumnos</p>
                </div>
                <Button 
                    onClick={() => setIsModalOpen(true)}
                    className="bg-[#002147] hover:bg-black text-white font-black rounded-2xl h-12 px-6 shadow-xl active:scale-95 transition-all"
                >
                    <UserPlus className="mr-2 h-5 w-5" /> Autorizar Nueva Persona
                </Button>
            </div>

            {/* Selector de Alumno */}
            <div className="flex gap-2 p-1 bg-slate-100 rounded-2xl w-fit">
                {estudiantes.map((est) => (
                    <button
                        key={est.id}
                        onClick={() => setSelectedAlumno(est.id)}
                        className={`px-6 py-2 rounded-xl text-xs font-black uppercase transition-all ${
                            selectedAlumno === est.id 
                            ? 'bg-white text-[#002147] shadow-sm' 
                            : 'text-slate-400 hover:text-slate-600'
                        }`}
                    >
                        {est.nombre}
                    </button>
                ))}
            </div>

            {/* Lista de Autorizados */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {authorizedList.map((auth) => (
                    <Card key={auth.id} className="rounded-[32px] overflow-hidden border-2 border-slate-100 group hover:border-blue-200 transition-all shadow-lg hover:shadow-xl">
                        <div className="aspect-square relative overflow-hidden bg-slate-50">
                            {auth.foto_url ? (
                                <img 
                                    src={auth.foto_url} 
                                    alt={auth.nombre_sustituto} 
                                    referrerPolicy="no-referrer"
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-slate-200">
                                    <User className="h-20 w-20" />
                                </div>
                            )}
                            
                            {/* Botón Eliminar: Siempre visible en móvil, hover en desktop */}
                            <button 
                                onClick={() => handleDelete(auth)}
                                className="absolute top-4 right-4 p-3 bg-red-500 text-white rounded-2xl md:opacity-0 md:group-hover:opacity-100 transition-all hover:bg-black shadow-xl z-10"
                            >
                                <Trash2 className="h-5 w-5" />
                            </button>

                            <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-slate-900/90 to-transparent">
                                <Badge className="bg-[#8A2BE2] text-white border-none font-black text-[10px] uppercase mb-1">
                                    {auth.parentesco}
                                </Badge>
                                <h4 className="text-white font-black text-xl leading-tight uppercase truncate tracking-tighter italic">{auth.nombre_sustituto}</h4>
                            </div>
                        </div>
                        <div className="p-6 bg-white flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <IdCard className="h-5 w-5 text-slate-300" />
                                <span className="font-bold text-slate-600 text-sm">{auth.cedula}</span>
                            </div>
                            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                        </div>
                    </Card>
                ))}

                {authorizedList.length === 0 && !isLoading && (
                    <div className="col-span-full py-16 text-center bg-slate-50 rounded-[40px] border-2 border-dashed border-slate-200">
                        <User className="h-16 w-16 text-slate-200 mx-auto mb-4" />
                        <p className="font-bold text-slate-400">No hay personas autorizadas por el momento.</p>
                    </div>
                )}
            </div>

            {/* Modal de Registro */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <Card className="w-full max-w-lg bg-white rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="bg-gradient-to-r from-[#002147] to-[#8A2BE2] p-8 text-white relative">
                            <button onClick={() => setIsModalOpen(false)} className="absolute top-5 right-5 text-white/50 hover:text-white transition-colors">
                                <X className="h-6 w-6" />
                            </button>
                            <h3 className="text-2xl font-black italic uppercase tracking-tighter">Nueva Autorización</h3>
                            <p className="text-white/60 text-xs font-bold uppercase tracking-widest mt-1">Garantiza la seguridad en la salida</p>
                        </div>
                        
                        <form onSubmit={handleSubmit} className="p-8 space-y-6">
                            <div className="flex flex-col items-center gap-4">
                                <div className="h-32 w-32 rounded-3xl bg-slate-50 border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden relative group">
                                    {previewUrl ? (
                                        <img src={previewUrl} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                                    ) : (
                                        <Camera className="h-10 w-10 text-slate-200" />
                                    )}
                                    <input 
                                        type="file" 
                                        accept="image/*" 
                                        capture="environment"
                                        onChange={handleFileChange}
                                        className="absolute inset-0 opacity-0 cursor-pointer"
                                        required
                                    />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity pointer-events-none">
                                        <Upload className="text-white h-6 w-6" />
                                    </div>
                                </div>
                                <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Foto de Identificación</span>
                            </div>

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase text-slate-400 ml-1">Nombre Completo del Sustituto</Label>
                                    <Input name="nombre_sustituto" required className="h-12 rounded-2xl border-2 font-bold focus:border-[#002147]" placeholder="Ej: Juan Pérez" />
                                </div>
                                
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase text-slate-400 ml-1">Cédula</Label>
                                        <Input name="cedula" required className="h-12 rounded-2xl border-2 font-bold focus:border-[#002147]" placeholder="000-0000000-0" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase text-slate-400 ml-1">Parentesco / Relación</Label>
                                        <Input name="parentesco" required className="h-12 rounded-2xl border-2 font-bold focus:border-[#002147]" placeholder="Ej: Tío, Abuelo..." />
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-4 pt-4">
                                <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)} className="flex-1 h-14 rounded-2xl font-black text-slate-400 border-0">
                                    Cancelar
                                </Button>
                                <Button type="submit" disabled={isLoading} className="flex-[2] h-14 rounded-2xl bg-[#002147] hover:bg-black text-white font-black shadow-lg shadow-blue-900/20">
                                    {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : "Guardar Autorización"}
                                </Button>
                            </div>
                        </form>
                    </Card>
                </div>
            )}
        </div>
    );
}
