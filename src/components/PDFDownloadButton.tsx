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
                    className={`w-full ${loading ? 'bg-slate-700' : 'bg-[#002147] hover:bg-[#003366]'} text-white font-black py-7 rounded-[40px] shadow-2xl transition-all active:scale-95 flex items-center justify-center gap-4 group border-b-4 border-blue-900 border-x border-t border-white/10`}
                >
                    {loading ? (
                        <Loader2 className="h-6 w-6 animate-spin" />
                    ) : (
                        <Download className="h-6 w-6 group-hover:translate-y-0.5 transition-transform" />
                    )}
                    <div className="flex flex-col items-start leading-tight">
                        <span className="text-sm font-black uppercase tracking-tighter">
                            {loading ? 'Generando Documento...' : 'Descargar Boletín Mensual'}
                        </span>
                        <span className="text-[10px] opacity-60 font-bold uppercase tracking-widest">
                            {mes} {ano} — Formato Oxford
                        </span>
                    </div>
                </Button>
            )}
        </PDFDownloadLink>
    );
}
