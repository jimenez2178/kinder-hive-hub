"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Printer, Download, ChevronLeft, Calendar as CalendarIcon, DollarSign, Users, Clock } from "lucide-react";
import Link from "next/link";

export function FinancialReportClient({ estudiantes, pagos, month, year }: {
    estudiantes: any[],
    pagos: any[],
    month: string,
    year: number
}) {
    const totalExpected = estudiantes.reduce((acc, est) => acc + (est.cuota_mensual || 7000), 0);
    const totalReceived = pagos.filter(p => p.estado === 'saldado').reduce((acc, p) => acc + (p.monto || 0), 0);
    const totalPending = Math.max(0, totalExpected - totalReceived);
    const collectionPercentage = totalExpected > 0 ? Math.round((totalReceived / totalExpected) * 100) : 0;

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="min-h-screen bg-white pb-20">
            {/* Report Controls (Hidden during print) */}
            <div className="print:hidden bg-slate-50 border-b border-slate-200 py-4 px-6 mb-8 sticky top-0 z-50">
                <div className="container mx-auto max-w-5xl flex items-center justify-between">
                    <Link href="/directora" className="flex items-center gap-2 text-slate-600 hover:text-[#004aad] font-bold transition-colors">
                        <ChevronLeft className="h-5 w-5" /> Regresar al Panel
                    </Link>
                    <div className="flex gap-4">
                        <Button onClick={handlePrint} className="bg-[#004aad] rounded-full px-6 font-bold shadow-lg shadow-[#004aad]/20">
                            <Printer className="mr-2 h-4 w-4" /> Imprimir Reporte
                        </Button>
                        <Button variant="outline" className="rounded-full px-6 font-bold border-2 border-slate-200">
                            <Download className="mr-2 h-4 w-4" /> Exportar PDF
                        </Button>
                    </div>
                </div>
            </div>

            <div className="container mx-auto max-w-5xl px-6" id="report-content">
                {/* Official Header */}
                <div className="text-center mb-12 py-8 border-b-2 border-slate-100">
                    <img
                        src="https://informativolatelefonica.com/wp-content/uploads/2026/03/LOGO.png"
                        alt="Logo Sagrada Familia"
                        className="w-24 h-24 mx-auto mb-4 object-contain"
                    />
                    <h1 className="text-3xl font-black text-[#004aad] uppercase tracking-tighter">
                        Pre-escolar Psicopedagógico de la Sagrada Familia
                    </h1>
                    <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mt-2">Reporte Financiero Mensual Institucional</p>
                    <div className="flex items-center justify-center gap-4 mt-6">
                        <Badge className="bg-[#8A2BE2] text-white text-lg px-6 py-1 rounded-full font-black uppercase">
                            {month} {year}
                        </Badge>
                    </div>
                </div>

                {/* Performance Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                    <Card className="rounded-[32px] border-2 border-slate-50 shadow-xl shadow-slate-200/50 overflow-hidden">
                        <CardContent className="p-8 group hover:bg-[#004aad] transition-colors duration-500">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="bg-[#004aad]/10 p-3 rounded-2xl group-hover:bg-white/20 transition-colors">
                                    <DollarSign className="text-[#004aad] group-hover:text-white" />
                                </div>
                                <span className="text-slate-400 group-hover:text-white/70 font-bold uppercase text-[10px] tracking-widest">Total Recaudado</span>
                            </div>
                            <div className="text-4xl font-black text-slate-800 group-hover:text-white transition-colors">RD$ {totalReceived.toLocaleString()}</div>
                            <p className="text-xs font-bold text-[#8A2BE2] group-hover:text-white mt-2 italic">Ingresos Ingresados</p>
                        </CardContent>
                    </Card>

                    <Card className="rounded-[32px] border-2 border-slate-50 shadow-xl shadow-slate-200/50 overflow-hidden">
                        <CardContent className="p-8 group hover:bg-[#020617] transition-colors duration-500">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="bg-red-50 p-3 rounded-2xl group-hover:bg-white/20 transition-colors">
                                    <Clock className="text-red-500 group-hover:text-white" />
                                </div>
                                <span className="text-slate-400 group-hover:text-white/70 font-bold uppercase text-[10px] tracking-widest">Saldo por Cobrar</span>
                            </div>
                            <div className="text-4xl font-black text-slate-800 group-hover:text-white transition-colors">RD$ {totalPending.toLocaleString()}</div>
                            <p className="text-xs font-bold text-slate-400 mt-2 uppercase">Pendiente de {estudiantes.length} alumnos</p>
                        </CardContent>
                    </Card>

                    <Card className="rounded-[32px] border-2 border-slate-50 shadow-xl shadow-slate-200/50 overflow-hidden">
                        <CardContent className="p-8 group hover:bg-[#FF1493] transition-colors duration-500">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="bg-[#FF1493]/10 p-3 rounded-2xl group-hover:bg-white/20 transition-colors">
                                    <Users className="text-[#FF1493] group-hover:text-white" />
                                </div>
                                <span className="text-slate-400 group-hover:text-white/70 font-bold uppercase text-[10px] tracking-widest">Efectividad</span>
                            </div>
                            <div className="text-5xl font-black text-slate-800 group-hover:text-white transition-colors">{collectionPercentage}%</div>
                            <div className="mt-4 h-2 w-full bg-slate-100 rounded-full overflow-hidden group-hover:bg-white/20">
                                <div className="h-full bg-[#8A2BE2] group-hover:bg-white transition-all duration-1000" style={{ width: `${collectionPercentage}%` }}></div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Detailed Table */}
                <Card className="rounded-[40px] border-0 shadow-2xl overflow-hidden bg-white mb-12">
                    <CardHeader className="bg-slate-50 py-6 px-10 border-b border-slate-100">
                        <CardTitle className="text-xl font-black text-slate-800 flex items-center justify-between">
                            Listado de Estudiantes y Estados de Pago
                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Matrícula Total: {estudiantes.length}</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50 text-[10px] uppercase tracking-widest text-slate-500 font-black">
                                        <th className="py-4 px-10">Estudiante</th>
                                        <th className="py-4 px-6">Grado</th>
                                        <th className="py-4 px-6">Monto Cuota</th>
                                        <th className="py-4 px-6">Estado</th>
                                        <th className="py-4 px-10 text-right">Monto Recibido</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {estudiantes.map((est) => {
                                        const pago = pagos.find(p => p.estudiante_id === est.id && p.estado === 'saldado');
                                        const isPaid = !!pago;

                                        return (
                                            <tr key={est.id} className="hover:bg-slate-50/50 transition-colors">
                                                <td className="py-4 px-10">
                                                    <span className="font-extrabold text-slate-800">{est.nombre}</span>
                                                </td>
                                                <td className="py-4 px-6">
                                                    <Badge variant="outline" className="text-[10px] font-bold text-slate-500 border-slate-200">{est.grado}</Badge>
                                                </td>
                                                <td className="py-4 px-6 font-bold text-slate-400">RD$ {est.cuota_mensual?.toLocaleString() || "7,000"}</td>
                                                <td className="py-4 px-6">
                                                    <Badge className={`rounded-full px-4 py-0.5 text-[9px] font-black uppercase border-none ${isPaid ? "bg-[#8A2BE2]/10 text-[#8A2BE2]" : "bg-red-100 text-red-600"}`}>
                                                        {isPaid ? "Saldado" : "Pendiente"}
                                                    </Badge>
                                                </td>
                                                <td className="py-4 px-10 text-right">
                                                    <span className={`font-black ${isPaid ? "text-[#004aad]" : "text-slate-300"}`}>
                                                        RD$ {isPaid ? pago.monto?.toLocaleString() : "0"}
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>

                {/* Footer and Signatures (Print Only) */}
                <div className="hidden print:block mt-20">
                    <div className="grid grid-cols-2 gap-20">
                        <div className="border-t-2 border-slate-800 pt-4 text-center">
                            <p className="font-black text-slate-800 uppercase text-xs">Firma de la Directora</p>
                            <p className="text-[10px] text-slate-400 font-bold mt-1 tracking-widest text-center">Dirección General - Kinder Hive Hub</p>
                        </div>
                        <div className="border-t-2 border-slate-800 pt-4 text-center">
                            <p className="font-black text-slate-800 uppercase text-xs">Sello Institucional</p>
                            <p className="text-[10px] text-slate-400 font-bold mt-1 tracking-widest text-center">Gestión Escolar {year}</p>
                        </div>
                    </div>
                    <div className="mt-20 text-center text-[8px] text-slate-300 font-bold uppercase tracking-[0.2em]">
                        Documento generado automáticamente por el Sistema Kinder Hive Hub el {new Date().toLocaleDateString('es-DO')}
                    </div>
                </div>
            </div>
        </div>
    );
}
