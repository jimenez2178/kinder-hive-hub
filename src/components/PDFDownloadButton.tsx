"use client";

import React, { useEffect, useState } from 'react';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { BoletinPDF } from './BoletinPDF';
import { Button } from '@/components/ui/button';
import { Download, Loader2 } from 'lucide-react';

interface Props {
    alumno: any;
    mes: string;
    ano: string;
    calificaciones: any[];
    asistencia: { presentes: number, ausentes: number };
    observaciones?: string;
}

export default function PDFDownloadButton({ alumno, mes, ano, calificaciones, asistencia, observaciones = "" }: Props) {
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);

    if (!isClient) return (
        <Button 
            disabled
            className="w-full bg-[#002147] opacity-50 text-white font-black py-7 rounded-[40px] flex items-center justify-center gap-4"
        >
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="text-sm font-black uppercase tracking-tighter">Preparando Generador...</span>
        </Button>
    );

    const fileName = `Boletin_${alumno?.nombre?.replace(/\s+/g, '_') || 'Alumno'}_${mes}.pdf`;
    
    // Obtenemos el nombre de la maestra de las calificaciones o evaluaciones si está disponible
    const maestraNombre = calificaciones?.[0]?.perfiles?.nombre_completo || "Lourdes de Jiménez";

    return (
        <PDFDownloadLink
            document={
                <BoletinPDF
                    alumno={alumno?.nombre || "Estudiante"}
                    grado={alumno?.grado || "Pre-escolar"}
                    maestra={maestraNombre}
                    mes={mes}
                    ano={ano}
                    calificaciones={calificaciones.map(c => ({ 
                        asignatura: c.asignatura || "Área de Desarrollo", 
                        nota: Number(c.nota_final || c.nota_mes || c.nota || 0) 
                    }))}
                    asistencia={asistencia}
                    observaciones={observaciones || alumno?.observaciones || ""}
                />
            }
            fileName={fileName}
        >
            {/* @ts-ignore */}
            {({ blob, url, loading, error }) => (
                <Button 
                    disabled={loading}
                    className={`w-full ${loading ? 'opacity-50' : 'opacity-100'} bg-white hover:bg-[#F0F4F8] text-[#002147] font-black py-8 rounded-[40px] shadow-xl transition-all active:scale-95 flex items-center justify-center gap-4 group border-2 border-[#D4AF37] relative overflow-hidden`}
                >
                    {/* Efecto de brillo sutil */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_2s_infinite] pointer-events-none" />
                    
                    {loading ? (
                        <Loader2 className="h-7 w-7 animate-spin text-[#002147]" />
                    ) : (
                        <Download className="h-8 w-8 text-[#005088] transition-transform group-hover:translate-y-0.5" />
                    )}
                    
                    <div className="flex flex-col items-start leading-none gap-1">
                        <span className="text-base font-black uppercase tracking-tight">
                            {loading ? 'Generando Boletín...' : 'Descargar Boletín Oficial'}
                        </span>
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] text-[#005088] font-bold uppercase tracking-[0.2em] opacity-80">
                                {mes} {ano}
                            </span>
                            <span className="h-1 w-1 rounded-full bg-[#D4AF37]" />
                            <span className="text-[10px] text-[#D4AF37] font-black uppercase tracking-widest">
                                Formato Oxford
                            </span>
                        </div>
                    </div>
                </Button>
            )}
        </PDFDownloadLink>
    );
}
