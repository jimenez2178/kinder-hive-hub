"use client";

import {
    Bell,
    Calendar,
    CreditCard,
    Image as ImageIcon,
    MessageCircle,
    Search,
    BookOpen,
    FileText,
    CheckCircle2,
    Printer,
    Download,
    Users,
    GraduationCap,
    Star,
    ChevronRight,
    AlertTriangle,
    MapPin,
    Phone,
    User,
    Edit3,
    Mic,
    Waves,
    UploadCloud,
    BellRing,
    Clock,
    Plus,
    Wallet,
    ExternalLink,
    Instagram as InstagramIcon,
    Trash2
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LogoutButton } from "@/components/LogoutButton";
import { useState, useEffect } from "react";
import { processParentPaymentAction, uploadComprobanteAction, reportarPagoAction } from "@/app/actions/padre";
import { createClient } from "@/utils/supabase/client";

function VideoPlayer({ url }: { url: string }) {
    if (!url) return null;

    const isInstagram = url.includes("instagram.com");

    const getEmbedUrl = (url: string) => {
        // Instagram
        if (url.includes("instagram.com")) {
            const cleanUrl = url.split('?')[0].replace(/\/$/, "");
            return `${cleanUrl}/embed/`;
        }

        // YouTube
        const ytMatch = url.match(/(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/);
        if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`;

        // Vimeo
        const vimeoMatch = url.match(/(?:https?:\/\/)?(?:www\.)?(?:vimeo\.com\/|player\.vimeo\.com\/video\/)([0-9]+)/);
        if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`;

        // Google Drive
        const driveMatch = url.match(/(?:https?:\/\/)?(?:drive\.google\.com\/file\/d\/)([a-zA-Z0-9_-]+)/);
        if (driveMatch) return `https://drive.google.com/file/d/${driveMatch[1]}/preview`;

        return url;
    };

    const embedUrl = getEmbedUrl(url);

    if (isInstagram) {
        return (
            <div className="mt-6 overflow-hidden rounded-[30px] border-4 border-white/20 shadow-2xl bg-white flex justify-center w-full">
                <iframe
                    src={embedUrl}
                    className="w-full max-w-[550px] aspect-[1/1.2] border-0"
                    allowTransparency={true}
                    allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
                ></iframe>
            </div>
        );
    }

    return (
        <div className="mt-6 overflow-hidden rounded-[40px] border-4 border-white/20 shadow-2xl bg-black/10 aspect-video relative group">
            <iframe
                src={embedUrl}
                className="absolute inset-0 w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
            ></iframe>
            <div className="absolute inset-0 pointer-events-none ring-1 ring-inset ring-white/10 rounded-[40px]"></div>
        </div>
    );
}

export default function DashboardClient({
    initialFrase,
    userName,
    saldoPendiente,
    estudiantes,
    comunicados = [],
    galeria = [],
    recibos = [],
    eventos = [],
    agradecimientos = [],
    evaluaciones = [],
    onDeleteComunicado
}: {
    initialFrase: string,
    userName: string,
    saldoPendiente: number,
    estudiantes: any[],
    comunicados?: any[],
    galeria?: any[],
    recibos?: any[],
    eventos?: any[],
    agradecimientos?: any[],
    evaluaciones?: any[],
    onDeleteComunicado?: (id: string) => Promise<void>
}) {
    const [frase] = useState(initialFrase);
    const [currentSaldo] = useState(saldoPendiente);
    const [selectedRecibo, setSelectedRecibo] = useState<any>(null);
    const [showAllPhotos, setShowAllPhotos] = useState(false);
    const [selectedStudentForFile, setSelectedStudentForFile] = useState<any>(null);
    const [showContact, setShowContact] = useState(false);
    const [contactTab, setContactTab] = useState<"menu" | "cita">("menu");
    const [citaOk, setCitaOk] = useState(false);
    const [uploadingPagoId, setUploadingPagoId] = useState<string | null>(null);
    const [showPushBanner, setShowPushBanner] = useState(false);
    const [showReportarModal, setShowReportarModal] = useState(false);
    const [reportData, setReportData] = useState({ estudiante_id: estudiantes[0]?.id || "", monto: "", concepto: "Mensualidad" });
    const [isReporting, setIsReporting] = useState(false);
    const [selectedPhoto, setSelectedPhoto] = useState<any>(null);
    const [showPhotoModal, setShowPhotoModal] = useState(false);
    const [hiddenAvisos, setHiddenAvisos] = useState<string[]>([]);

    useEffect(() => {
        console.log("Checking Service Worker support...");
        if ("serviceWorker" in navigator && "PushManager" in window) {
            navigator.serviceWorker.register("/sw.js")
                .then((reg) => {
                    console.log("Service Worker registered successfully:", reg.scope);
                    reg.pushManager.getSubscription().then((sub) => {
                        console.log("Current subscription:", sub);
                        if (!sub) {
                            setShowPushBanner(true);
                        }
                    });
                })
                .catch(err => {
                    console.error("Service Worker registration failed:", err);
                });
        } else {
            console.warn("Push notifications are not supported in this browser.");
        }
    }, []);

    const subscribeToPush = async () => {
        console.log("Initializing push subscription process...");
        try {
            // Check for VAPID key
            const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
            console.log("VAPID Key present:", !!vapidKey);
            
            if (!vapidKey) {
                alert("Error técnico: Falta la llave VAPID de configuración.");
                return;
            }

            // 1. Request Permission explicitly
            console.log("Requesting notification permission...");
            const permission = await Notification.requestPermission();
            console.log("Permission result:", permission);

            if (permission !== 'granted') {
                alert("Para recibir alertas inmediatas, debes permitir las notificaciones en la configuración de tu navegador.");
                return;
            }

            // 2. Register/Wait for Service Worker
            const reg = await navigator.serviceWorker.ready;
            console.log("Service Worker ready for subscription.");

            // 3. Subscribe
            const sub = await reg.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: vapidKey
            });
            console.log("Push Subscription successful:", JSON.stringify(sub));

            // 4. Update Database
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                console.log("Updating push token for user:", user.id);
                const { error } = await supabase.from('perfiles').update({ push_token: JSON.stringify(sub) }).eq('id', user.id);
                if (error) console.error("Database update error:", error);
                else console.log("Database updated successfully.");
            }

            setShowPushBanner(false);
            alert("¡Genial! Las notificaciones inmediatas han sido activadas con éxito.");
        } catch (error) {
            console.error("Error in subscribeToPush:", error);
            alert("No se pudo activar las notificaciones. Asegúrate de que tu navegador soporte PWA y no estés en modo incógnito.");
        }
    };

    const handleUploadComprobante = async (pagoId: string, e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploadingPagoId(pagoId);
        const supabase = createClient();
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `${pagoId}/${fileName}`;

        const { error: uploadError } = await supabase.storage
            .from('comprobantes_pagos')
            .upload(filePath, file);

        if (uploadError) {
            alert('Error al subir el comprobante: ' + uploadError.message);
            setUploadingPagoId(null);
            return;
        }

        const { data: { publicUrl } } = supabase.storage
            .from('comprobantes_pagos')
            .getPublicUrl(filePath);

        const res = await uploadComprobanteAction(pagoId, publicUrl);
        if (res?.error) {
            alert(res.error);
        } else {
            alert('Comprobante subido exitosamente y en revisión.');
        }
        setUploadingPagoId(null);
    };

    const handleReportSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsReporting(true);
        const res = await reportarPagoAction({
            ...reportData,
            monto: Number(reportData.monto)
        });
        setIsReporting(false);
        if (res.error) alert(res.error);
        else {
            alert("Pago reportado exitosamente. Será revisado por la administración.");
            setShowReportarModal(false);
            setReportData({ estudiante_id: estudiantes[0]?.id || "", monto: "", concepto: "Mensualidad" });
        }
    };

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="min-h-screen bg-[#f0f4f8] pb-20">
            {/* MARQUEE TOP BAR */}
            <div className="bg-[#020617] px-4 py-2 text-white text-xs font-black overflow-hidden">
                <div className="animate-marquee inline-block whitespace-nowrap">
                    ✨ {frase} &nbsp;&nbsp;&nbsp;&nbsp;&nbsp; ✨ {frase} &nbsp;&nbsp;&nbsp;&nbsp;&nbsp; ✨ {frase}
                </div>
            </div>

            <div className="container mx-auto max-w-6xl pt-8 px-4 sm:px-6">

                {/* ═══ HEADER PREMIUM OXFORD LOOK (FORZADO V3) ═══ */}
                <header 
                    style={{ backgroundColor: '#002147' }}
                    className="rounded-[40px] p-7 mb-10 shadow-2xl shadow-blue-900/20 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden text-white"
                >
                    {/* Orb decorativo */}
                    <div className="absolute -right-16 -top-16 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none" />
                    <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />

                    <div className="flex flex-col md:flex-row items-center gap-6 z-10 text-center md:text-left">
                        <div className="bg-white p-0 rounded-[28px] shadow-2xl border-4 border-white/70 overflow-hidden flex items-center justify-center">
                            <img
                                src="https://informativolatelefonica.com/wp-content/uploads/2026/03/LOGO.png"
                                alt="Logo Sagrada Familia"
                                className="w-[220px] h-auto object-contain transition-transform hover:scale-105 duration-500"
                            />
                        </div>
                        <div>
                            <h1 
                                style={{ color: '#FFFFFF' }}
                                className="text-3xl md:text-5xl font-black italic tracking-tight leading-tight drop-shadow-lg"
                            >
                                ¡Hola, {userName}! 👋
                            </h1>
                            <p className="text-blue-100/70 font-semibold mt-1 text-sm">
                                Portal Familiar · Pre-escolar Sagrada Familia
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-col md:flex-row items-center gap-3 z-10">
                        <span className="bg-white/10 text-white text-[10px] font-black px-4 py-2 rounded-full border border-white/20 backdrop-blur-sm uppercase tracking-widest">
                            Ciclo 2026–2027
                        </span>
                        <div className="bg-white/5 p-1.5 rounded-full backdrop-blur-md">
                            <LogoutButton />
                        </div>
                    </div>
                </header>

                {/* ═══ BLOQUE DE COMUNICADOS (JERARQUÍA TOTAL) ═══ */}
                {comunicados.filter((c) => !hiddenAvisos.includes(c.id)).length > 0 && (
                    <div className="space-y-6 mb-10">
                        {comunicados.filter((c) => !hiddenAvisos.includes(c.id)).slice(0, 3).map((com, idx) => {
                            const p = com.prioridad?.toLowerCase();
                            const isUrgent = p === 'alta' || p === 'urgente';
                            const isWarning = p === 'media' || p === 'advertencia';
                            
                            return (
                                <div 
                                    key={com.id || idx}
                                    className={`rounded-[40px] p-8 shadow-2xl relative overflow-hidden transition-all animate-in slide-in-from-top-4 border-l-[12px] group ${
                                        isUrgent 
                                            ? 'bg-[#ef4444] border-white/20' 
                                            : isWarning
                                                ? 'bg-[#ffcc00] border-black/10'
                                                : 'bg-[#002147] border-white/10'
                                    }`}
                                >
                                    {onDeleteComunicado ? (
                                        <button
                                            onClick={() => {
                                                if (window.confirm("¿Estás seguro de que deseas borrar este aviso globalmente?")) {
                                                    onDeleteComunicado(com.id);
                                                }
                                            }}
                                            className="absolute top-4 right-4 p-3 bg-red-600 hover:bg-red-700 text-white rounded-full transition-all z-20 shadow-xl"
                                            title="Borrar Aviso (Global)"
                                        >
                                            <Trash2 className="h-5 w-5" />
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => setHiddenAvisos([...hiddenAvisos, com.id])}
                                            className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all z-20 backdrop-blur-md"
                                            title="Marcar como leído / Ocultar"
                                        >
                                            <span className="text-xs font-black uppercase tracking-widest px-2">Entendido ✕</span>
                                        </button>
                                    )}
                                    <div className="flex items-center gap-4 mb-4">
                                        <span className={`text-3xl ${isUrgent ? 'animate-bounce' : ''}`}>
                                            {isUrgent ? '🚨' : isWarning ? '⚠️' : 'ℹ️'}
                                        </span>
                                        <span className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest whitespace-nowrap ${
                                            isWarning ? 'bg-black/10 text-black' : 'bg-white/20 text-white'
                                        }`}>
                                            {isUrgent ? 'Urgente / Crítico' : isWarning ? 'Aviso Escolar' : 'Información'}
                                        </span>
                                    </div>
                                    <h4 className={`font-black text-2xl leading-tight drop-shadow-sm ${
                                        isWarning ? 'text-black' : 'text-white'
                                    }`}>
                                        {com.titulo}
                                    </h4>
                                    <p className={`text-lg font-medium mt-3 leading-relaxed max-w-4xl ${
                                        isWarning ? 'text-black/80' : 'text-white/90'
                                    }`}>
                                        {com.contenido}
                                    </p>
                                    {com.video_url && <VideoPlayer url={com.video_url} />}
                                </div>
                            );
                        })}
                    </div>
                )}
                

                {/* PUSH NOTIFICATIONS BANNER */}
                {showPushBanner && (
                    <div className="bg-[#8A2BE2] text-white rounded-[32px] p-6 mb-10 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4 animate-in slide-in-from-top-4">
                        <div className="flex items-center gap-4">
                            <div className="bg-white/20 p-3 rounded-full shrink-0">
                                <BellRing className="h-6 w-6 text-white" />
                            </div>
                            <div>
                                <h3 className="font-black text-lg leading-tight">Activar Alertas Inmediatas</h3>
                                <p className="text-white/80 text-sm font-semibold mt-1">Recibe notificaciones en tu celular sobre pagos, comunicados y eventos.</p>
                            </div>
                        </div>
                        <Button onClick={subscribeToPush} className="rounded-full bg-white hover:bg-slate-100 text-[#8A2BE2] font-black shrink-0 px-6 h-12 w-full sm:w-auto">
                            Activar Ahora
                        </Button>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-10">

                    {/* ═══ COLUMNA IZQUIERDA ═══ */}
                    <div className="lg:col-span-2 space-y-8">

                        {/* KPI CARDS */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">

                            {/* TARJETA AMARILLA — Mensualidad (Lo que paga el estudiante) */}
                            <div className="bg-[#ffcc00] rounded-[40px] p-8 shadow-2xl shadow-amber-200/50 relative overflow-hidden transition-all hover:scale-[1.02] border-0">
                                <div className="absolute right-4 top-4 text-[#020617]/10 text-8xl font-black leading-none pointer-events-none select-none italic">RD$</div>
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#020617]/60 mb-2">Mensualidad Total</p>
                                <div className="text-5xl font-black text-[#020617] tracking-tighter">
                                    RD$ {estudiantes.reduce((acc, est) => acc + (Number(est.cuota_mensual) || 0), 0).toLocaleString('es-DO')}
                                </div>
                                <div className="mt-4 flex flex-col gap-2">
                                    <div className={`inline-flex items-center gap-1.5 text-[10px] font-black px-4 py-1.5 rounded-full w-fit ${currentSaldo > 0 ? 'bg-black text-[#ffcc00]' : 'bg-white text-sky-700'}`}>
                                        {currentSaldo > 0 ? `⚠️ PENDIENTE: RD$ ${currentSaldo.toLocaleString()}` : '✓ CUENTA AL DÍA'}
                                    </div>
                                    <p className="text-[9px] font-bold text-black/40 italic uppercase">Referencia para pagos mensuales</p>
                                </div>
                            </div>

                            {/* TARJETA PÚRPURA — Hijos */}
                            <div className="bg-[#8A2BE2] rounded-[40px] p-8 shadow-2xl shadow-purple-200/50 relative overflow-hidden transition-all hover:scale-[1.02] border-0">
                                <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-white/10 rounded-full blur-2xl pointer-events-none" />
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60 mb-3">Dependientes Académicos</p>
                                <div className="space-y-4 relative z-10">
                                    {estudiantes.length > 0 ? estudiantes.map(est => (
                                        <div key={est.id} className="bg-white/15 backdrop-blur-md rounded-[28px] p-5 border border-white/20 shadow-inner">
                                            <div className="flex justify-between items-start mb-1">
                                                <span className="font-black text-white text-lg leading-tight tracking-tight">{est.nombre}</span>
                                                <Badge className="bg-white text-[#8A2BE2] font-black text-[9px] px-3 py-0.5 rounded-full border-0 uppercase">{est.grado}</Badge>
                                            </div>
                                            <p className="text-white/60 text-[10px] font-bold uppercase tracking-widest mb-4 italic">Ciclo Escolar 2026–2027</p>
                                            <button
                                                onClick={() => setSelectedStudentForFile(est)}
                                                className="w-full bg-[#F0F4F8] hover:bg-white text-[#020617] font-black text-xs py-3 rounded-full shadow-lg transition-all hover:shadow-[#F0F4F8]/30 active:scale-95 flex items-center justify-center gap-2 uppercase tracking-tighter"
                                            >
                                                <FileText className="h-4 w-4" /> Ver Ficha Digital
                                            </button>
                                        </div>
                                    )) : (
                                        <p className="text-white/60 italic text-sm">No hay estudiantes asociados</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* PRÓXIMOS EVENTOS (Reubicado debajo de Ficha Digital) */}
                        <div className="bg-[#F0F4F8]/10 rounded-[40px] shadow-sm overflow-hidden border-2 border-[#F0F4F8]/40 p-1 mt-6 ring-4 ring-[#F0F4F8]/10">
                            <div className="bg-white rounded-[35px] overflow-hidden">
                                <div className="px-7 pt-6 pb-4 border-b border-slate-100 flex items-center justify-between">
                                    <h4 className="text-xl font-black text-[#002147] uppercase tracking-tight flex items-center gap-3">
                                        <Calendar className="h-5 w-5 text-[#8A2BE2]" />
                                        Próximos Eventos
                                    </h4>
                                </div>
                                <div className="p-5 space-y-4">
                                    {eventos.length > 0 ? eventos.map((ev) => {
                                        // Robust date parsing enforcing local noon to prevent UTC timezone shifts
                                        const rawDateStr = ev.fecha ? ev.fecha.split('T')[0] : '';
                                        const rawDate = rawDateStr ? new Date(rawDateStr + 'T12:00:00') : new Date();
                                        const date = isNaN(rawDate.getTime()) ? new Date() : rawDate;
                                        
                                        const monthShort = date.toLocaleDateString('es-DO', { month: 'short' }).toUpperCase().replace('.', '');
                                        const day = date.getDate();
                                        
                                        // Highlight this week events using #F0F4F8
                                        const lowerTitle = ev.titulo.toLowerCase();
                                        let EventIcon = Calendar;
                                        let iconColor = "text-[#002147]";
                                        let evtColor = "bg-[#002147]";
                                        
                                        if (lowerTitle.includes('evaluacion') || lowerTitle.includes('examen') || lowerTitle.includes('evaluación')) {
                                            EventIcon = Edit3;
                                            iconColor = "text-[#FF1493]";
                                            evtColor = "bg-[#FF1493]";
                                        } else if (lowerTitle.includes('conferencia') || lowerTitle.includes('padre') || lowerTitle.includes('reunion')) {
                                            EventIcon = Mic;
                                            iconColor = "text-[#8A2BE2]";
                                            evtColor = "bg-[#8A2BE2]";
                                        } else if (lowerTitle.includes('piscina') || lowerTitle.includes('aqua')) {
                                            EventIcon = Waves;
                                            iconColor = "text-[#0099ff]";
                                            evtColor = "bg-[#0099ff]";
                                        }
                                        
                                        const now = new Date();
                                        // Normalize times to midnight for accurate day comparison
                                        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
                                        const eventTime = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
                                        const isThisWeek = eventTime >= today && eventTime < (today + 7 * 24 * 60 * 60 * 1000);
                                        
                                        const dayName = date.toLocaleDateString('es-DO', { weekday: 'long' });
                                        const capitalizedDay = dayName.charAt(0).toUpperCase() + dayName.slice(1);
                                        const fullDateStr = `${capitalizedDay}, ${day} de ${monthShort.toUpperCase()}`;
                                        
                                        return (
                                            <div key={ev.id} className="bg-white p-8 rounded-[40px] shadow-xl border border-slate-100 flex flex-col gap-6 relative overflow-hidden group hover:shadow-2xl transition-all duration-500">
                                                {/* Header Oxford */}
                                                <div>
                                                    <h5 className="font-black text-[#002147] text-2xl md:text-3xl italic uppercase tracking-tighter leading-none mb-2">
                                                        {ev.titulo}
                                                    </h5>
                                                    <div className="flex items-center gap-2 text-slate-500 font-bold text-sm tracking-tight capitalize">
                                                        <Calendar className="h-4 w-4 text-[#8A2BE2]" />
                                                        {fullDateStr} {ev.locacion ? ` — ${ev.locacion}` : ''}
                                                    </div>
                                                </div>

                                                {/* Body */}
                                                {ev.descripcion && (
                                                    <div className="text-slate-600 text-base md:text-lg font-medium leading-relaxed">
                                                        {ev.descripcion}
                                                    </div>
                                                )}

                                                {/* Footer / Contribution */}
                                                {(lowerTitle.includes('piscina') || lowerTitle.includes('aqua')) && (
                                                    <div className="flex justify-end mt-2">
                                                        <div className="bg-[#002147] text-white px-6 py-3 rounded-2xl text-xs font-black tracking-widest uppercase shadow-lg shadow-blue-900/20 flex items-center gap-2">
                                                            <Waves className="h-4 w-4" />
                                                            Contribución: RD$ 200.00
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    }) : (
                                        <div className="p-4 bg-slate-50 rounded-2xl text-center">
                                            <p className="text-xs font-bold text-slate-400">No hay eventos programados.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* GALERÍA */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between px-1">
                                <h3 className="text-xl font-black text-slate-800 flex items-center gap-2">
                                    <span className="bg-[#ffcc00] p-1.5 rounded-lg">
                                        <ImageIcon className="h-4 w-4 text-[#020617]" />
                                    </span>
                                    Galería de Momentos
                                </h3>
                                <div className="bg-slate-100 px-4 py-1.5 rounded-full border border-slate-200">
                                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{galeria.length} {galeria.length === 1 ? 'Momento' : 'Momentos'}</span>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-6">
                                {galeria.length > 0 ? galeria.map((img, i) => (
                                    <div key={img.id || i} className="bg-white rounded-[32px] overflow-hidden shadow-xl border border-slate-50 group hover:shadow-2xl transition-all duration-500 flex flex-col h-full">
                                        <div className="aspect-[4/5] sm:aspect-square relative overflow-hidden">
                                            <img src={img.foto_url} alt={img.titulo} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                                            <div className="absolute top-4 left-4 z-10">
                                                <Badge className="bg-white/90 backdrop-blur-md text-[#020617] font-black text-[9px] uppercase px-3 py-1 rounded-full border-0 shadow-sm">ACTIVIDAD</Badge>
                                            </div>
                                            {/* Gradiente sutil sobre la imagen */}
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </div>
                                        <div className="p-6 flex flex-col flex-1 bg-white">
                                            <h5 className="font-black text-slate-800 text-sm italic uppercase tracking-tighter leading-tight mb-2 group-hover:text-[#002147] transition-colors">{img.titulo}</h5>
                                            {img.descripcion && (
                                                <p className="text-[11px] font-medium text-slate-500 leading-relaxed line-clamp-2 md:line-clamp-3">{img.descripcion}</p>
                                            )}
                                            <div className="mt-auto pt-4 flex items-center justify-between border-t border-slate-50">
                                                <span className="text-[9px] font-bold text-slate-400 uppercase">{new Date(img.created_at).toLocaleDateString('es-DO')}</span>
                                                <button onClick={() => { setSelectedPhoto(img); setShowPhotoModal(true); }} className="text-[9px] font-black text-[#8A2BE2] uppercase tracking-widest hover:underline">Ampliar</button>
                                            </div>
                                        </div>
                                    </div>
                                )) : (
                                    <div className="col-span-full h-60 bg-white rounded-[40px] border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400 shadow-inner">
                                        <ImageIcon className="h-12 w-12 mb-3 opacity-20" />
                                        <p className="font-extrabold text-base tracking-tight italic">Nuestros pequeños están creando recuerdos...</p>
                                        <p className="text-xs font-bold text-slate-300 uppercase mt-1">Pronto verás fotos aquí</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* AGRADECIMIENTOS */}
                        <div className="space-y-4">
                            <h3 className="text-xl font-black text-slate-800 flex items-center gap-2 px-1">
                                <span className="bg-[#8A2BE2]/15 p-1.5 rounded-lg">
                                    <MessageCircle className="h-4 w-4 text-[#8A2BE2]" />
                                </span>
                                Agradecimientos
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                {agradecimientos.length > 0 ? agradecimientos.map((ag) => (
                                    <div key={ag.id} className="bg-[#ff8f1c] p-8 rounded-[48px] shadow-2xl relative overflow-hidden group hover:scale-[1.02] transition-transform duration-500">
                                        <div className="absolute -right-6 -bottom-6 opacity-10 rotate-12 transition-transform group-hover:scale-110 group-hover:rotate-0 duration-700">
                                            <MessageCircle className="w-40 h-40 text-white" />
                                        </div>
                                        <div className="relative z-10">
                                            <p className="text-white font-bold italic text-xl leading-relaxed mb-8 drop-shadow-sm">"{ag.contenido}"</p>
                                            <div className="flex items-center justify-between">
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] font-black text-white/60 uppercase tracking-widest">{ag.titulo}</span>
                                                    <span className="text-white font-black text-sm uppercase italic tracking-tighter">Sagrada Familia</span>
                                                </div>
                                                <div className="bg-white/20 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/20">
                                                    <span className="text-white text-[9px] font-black uppercase tracking-widest">COMUNIDAD</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )) : (
                                    <div className="col-span-full h-20 bg-white rounded-[28px] border-2 border-dashed border-slate-200 flex items-center justify-center text-slate-400 italic font-bold text-sm">
                                        Gracias por ser parte de nuestra comunidad.
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* PROGRESO ACADÉMICO */}
                        <div className="space-y-4">
                            <h3 className="text-xl font-black text-slate-800 flex items-center gap-2 px-1">
                                <span className="bg-slate-800/10 p-1.5 rounded-lg">
                                    <GraduationCap className="h-4 w-4 text-slate-800" />
                                </span>
                                Progreso Académico
                            </h3>
                            <div className="space-y-4">
                                {evaluaciones && evaluaciones.length > 0 ? evaluaciones.map((ev: any) => (
                                    <div key={ev.id} className="bg-[#E1F5FE] p-8 md:p-12 rounded-[55px] shadow-2xl relative overflow-hidden group hover:scale-[1.01] transition-all duration-500 border-4 border-white/40">
                                        {/* Decoración de fondo */}
                                        <div className="absolute -right-16 -bottom-16 opacity-5 rotate-12 transition-transform group-hover:scale-110 duration-1000">
                                            <Star className="w-80 h-80 text-[#002147]" fill="currentColor" />
                                        </div>
                                        
                                        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
                                            {/* Info Estudiante (4 cols) */}
                                            <div className="lg:col-span-4 flex items-center gap-6">
                                                <div className="h-24 w-24 rounded-[35px] bg-white/40 backdrop-blur-xl flex items-center justify-center border-2 border-white/60 shadow-2xl shrink-0">
                                                    <Star className="text-[#002147] h-12 w-12 drop-shadow-lg" fill="currentColor" />
                                                </div>
                                                <div className="space-y-3">
                                                    <h5 className="font-black text-[#002147] text-3xl tracking-tighter leading-none">{ev.estudiantes?.nombre}</h5>
                                                    <div className="flex flex-wrap gap-2">
                                                        <div className="bg-white px-4 py-1.5 rounded-full shadow-xl">
                                                            <span className="text-[#002147] font-black text-[10px] uppercase tracking-widest">{ev.categoria}</span>
                                                        </div>
                                                        {ev.perfiles?.nombre_completo && (
                                                            <div className="bg-[#002147]/10 backdrop-blur-lg px-4 py-1.5 rounded-full border border-[#002147]/10">
                                                                <span className="text-[#002147] font-black text-[9px] uppercase tracking-tighter">🎓 {ev.perfiles.nombre_completo}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Observaciones (6 cols) */}
                                            <div className="lg:col-span-6 lg:border-l lg:border-[#002147]/10 lg:pl-10">
                                                <div className="relative">
                                                    <div className="absolute -left-6 -top-4 text-6xl text-[#002147]/10 font-serif translate-y-2">“</div>
                                                    <p className="text-[#002147] font-bold italic text-xl leading-relaxed drop-shadow-sm">
                                                        {ev.observaciones}
                                                    </p>
                                                    <div className="absolute -right-2 -bottom-8 text-6xl text-[#002147]/10 font-serif rotate-180">“</div>
                                                </div>
                                            </div>

                                            {/* Fecha (2 cols) */}
                                            <div className="lg:col-span-2 flex justify-center lg:justify-end">
                                                <div className="bg-[#002147] p-6 rounded-[40px] text-center border border-white/20 shadow-xl min-w-[140px]">
                                                    <span className="text-[10px] font-black text-white/50 uppercase tracking-[0.3em] block mb-2">REGISTRO</span>
                                                    <span className="text-2xl font-black text-white uppercase italic tracking-tighter">{new Date(ev.created_at).toLocaleDateString('es-DO', { day: 'numeric', month: 'short' }).replace('.', '')}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )) : (
                                    <div className="h-20 bg-white rounded-[28px] border-2 border-dashed border-slate-200 flex items-center justify-center text-slate-400 italic font-bold text-sm">
                                        Aún no hay reportes académicos disponibles.
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* HISTORIAL DE RECIBOS */}
                        <div className="bg-white rounded-[40px] shadow-2xl overflow-hidden border-0">
                            <div className="px-8 pt-8 pb-6 bg-slate-50/50 flex items-center justify-between border-b border-slate-100">
                                <div className="flex items-center gap-3">
                                    <div className="bg-[#F0F4F8]/20 p-2.5 rounded-2xl">
                                        <FileText className="h-5 w-5 text-sky-700" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-black text-slate-800 italic uppercase tracking-tighter">Historial de Pagos</h3>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Documentos fiscales y recibos</p>
                                    </div>
                                </div>
                                 <div className="flex items-center gap-3">
                                    <Button 
                                        onClick={() => setShowReportarModal(true)}
                                        className="h-9 px-4 rounded-full bg-[#8A2BE2] hover:bg-[#7223bd] text-white text-[10px] font-black uppercase shadow-lg shadow-[#8A2BE2]/20"
                                    >
                                        <Plus className="w-3 h-3 mr-1" /> Reportar Pago
                                    </Button>
                                    <div className="bg-white px-4 py-1.5 rounded-full border border-slate-100 shadow-sm text-[10px] font-black text-slate-400 uppercase">
                                        {recibos.length} comprobantes
                                    </div>
                                 </div>
                            </div>
                            <div className="divide-y divide-slate-50">
                                {recibos.length > 0 ? recibos.map((rec) => (
                                    <div key={rec.id} className="flex items-center justify-between px-8 py-5 hover:bg-slate-50 transition-colors">
                                        <div className="flex items-center gap-4">
                                            <div className="bg-[#8A2BE2]/10 h-11 w-11 rounded-2xl flex items-center justify-center shrink-0">
                                                <CheckCircle2 className="h-5 w-5 text-[#8A2BE2]" />
                                            </div>
                                            <div>
                                                <p className="font-black text-slate-800 text-sm">{rec.estudiantes?.nombre || "Pago Colegio"}</p>
                                                <p className="text-[11px] font-semibold text-slate-400">{new Date(rec.fecha + 'T12:00:00').toLocaleDateString('es-DO', { day: 'numeric', month: 'long' })} · {(rec.metodo || '').toLowerCase()}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="font-black text-slate-900">RD$ {rec.monto?.toLocaleString('es-DO')}</div>
                                            {rec.estado === 'saldado' || rec.estado === 'aprobado' ? (
                                                <button
                                                    onClick={() => setSelectedRecibo(rec)}
                                                    className="text-[10px] font-black text-[#8A2BE2] hover:text-[#002147] uppercase tracking-widest flex items-center gap-1 mt-1 ml-auto transition-colors"
                                                >
                                                    <Printer className="h-3 w-3" /> Ver Recibo
                                                </button>
                                            ) : rec.estado === 'en_revision' ? (
                                                <div className="flex flex-col items-end gap-1 mt-1">
                                                    <Badge className="bg-[#ffcc00] text-black font-black text-[9px] uppercase border-none shadow-sm flex items-center justify-center gap-1">
                                                        <Clock className="w-3 h-3" /> En Revisión
                                                    </Badge>
                                                    {rec.url_comprobante && (
                                                        <a 
                                                            href={rec.url_comprobante} 
                                                            target="_blank" 
                                                            rel="noopener noreferrer"
                                                            className="text-[9px] font-bold text-[#002147] hover:underline flex items-center gap-0.5"
                                                        >
                                                            Ver Foto <ExternalLink className="w-2.5 h-2.5" />
                                                        </a>
                                                    )}
                                                </div>
                                            ) : (
                                                <div className="mt-1 relative">
                                                    <input
                                                        type="file"
                                                        accept="image/*,.pdf"
                                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                                        onChange={(e) => handleUploadComprobante(rec.id, e)}
                                                        disabled={uploadingPagoId === rec.id}
                                                    />
                                                    <div className="flex flex-col items-end gap-1">
                                                        <Badge className="bg-[#002147] hover:bg-[#003785] cursor-pointer text-white font-black text-[9px] uppercase hover:scale-105 transition-transform flex items-center justify-center gap-1 min-w-[120px]">
                                                            {uploadingPagoId === rec.id ? "Subiendo..." : <><UploadCloud className="w-3 h-3" /> Subir Comprobante</>}
                                                        </Badge>
                                                        {rec.estado === 'rechazado' && (
                                                            <span className="text-[8px] font-bold text-rose-500 uppercase tracking-tighter">⚠️ Rechazado: Sube otro</span>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )) : (
                                    <p className="p-8 text-center text-slate-400 font-medium italic text-sm">No se han registrado pagos aún.</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* ═══ COLUMNA DERECHA ═══ */}
                    <div className="space-y-6">
                        {/* CARD MENSUALIDAD */}
                        <div className="bg-white rounded-[32px] shadow-xl p-6 border-t-4 border-[#F0F4F8]">
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Mensualidad</p>
                            {estudiantes.length > 0 ? (
                                <div className="space-y-2">
                                    {estudiantes.map(est => (
                                        <div key={est.id} className="flex items-center justify-between">
                                            <span className="text-sm font-bold text-slate-600 truncate pr-2">{est.nombre}</span>
                                            <span className="font-black text-[#002147] shrink-0">
                                                RD$ {est.cuota_mensual ? Number(est.cuota_mensual).toLocaleString('es-DO') : '—'}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-slate-400 italic text-sm">—</p>
                            )}
                        </div>

                    </div>
                </div>
            </div>


            {/* GALLERY MODAL */}
            {showAllPhotos && (
                <div className="fixed inset-0 bg-slate-900/95 backdrop-blur-xl z-[100] flex flex-col items-center justify-center p-8">
                    <button onClick={() => setShowAllPhotos(false)} className="absolute top-8 right-8 text-white scale-150 font-black">✕</button>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 w-full max-w-6xl overflow-y-auto max-h-[80vh] p-4">
                        {galeria.map((img, i) => (
                            <Card key={i} className="rounded-[32px] border-0 overflow-hidden bg-white/5 border border-white/10">
                                <img src={img.foto_url} className="w-full aspect-[4/3] object-cover" />
                                <div className="p-4 text-white text-sm font-bold">{img.titulo}</div>
                            </Card>
                        ))}
                    </div>
                </div>
            )}

            {/* RECEIPT MODAL */}
            {selectedRecibo && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[150] flex items-center justify-center p-4 print:p-0 print:bg-white print:relative print:z-0">
                    <Card className="w-full max-w-xl rounded-[40px] shadow-2xl bg-white overflow-hidden print:shadow-none print:rounded-none print:max-w-none">
                        <div className="p-8 print:p-4">
                            <div className="flex justify-between items-center mb-8 print:hidden">
                                <Button variant="ghost" onClick={() => setSelectedRecibo(null)} className="rounded-full font-bold text-slate-400">Cerrar</Button>
                                <Button onClick={handlePrint} className="bg-[#8A2BE2] hover:bg-[#7726c5] text-white rounded-full font-black px-6">
                                    <Printer className="mr-2 h-4 w-4" /> Imprimir Recibo
                                </Button>
                            </div>
                            <div className="border-4 border-slate-50 p-8 rounded-[32px] print:border-2 print:p-6">
                                <div className="text-center mb-6">
                                    <img src="https://informativolatelefonica.com/wp-content/uploads/2026/03/LOGO.png" alt="Logo" className="h-24 w-24 mx-auto mb-2 object-contain" />
                                    <h1 className="text-xl font-black text-[#002147] uppercase leading-tight tracking-tighter">Pre-escolar Psicopedagógico De la Sagrada Familia</h1>
                                    <div className="text-[11px] font-mono text-slate-500 mt-1 space-y-0.5">
                                        <p>RNC: 131596152</p>
                                        <p>Alma Rosa I, Santo Domingo Este</p>
                                    </div>
                                    <div className="flex justify-center items-center gap-4 mt-4 border-t border-[#8A2BE2]/10 pt-4">
                                        <p className="text-[12px] font-black text-[#8A2BE2] uppercase tracking-widest">RECIBO OFICIAL DE PAGO</p>
                                        <Badge className="bg-sky-600 hover:bg-sky-600 text-white font-black text-[10px] uppercase border-0">Pagado</Badge>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-6 mb-8 py-6 border-y border-slate-100">
                                    <div>
                                        <span className="text-[9px] font-black text-slate-400 uppercase block mb-1">Pagado por:</span>
                                        <p className="font-extrabold text-slate-800">
                                            {selectedRecibo.estudiantes?.tutor_nombre || selectedRecibo.estudiantes?.nombre_madre || userName}
                                        </p>
                                        <p className="text-[10px] font-bold text-slate-500 mt-0.5">
                                            Tel: {
                                                estudiantes.find(e => e.id === selectedRecibo.estudiante_id)?.padre_telefono ||
                                                selectedRecibo.estudiantes?.telefono_tutor ||
                                                selectedRecibo.estudiantes?.telefono_madre ||
                                                "Pendiente de actualizar"
                                            }
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-[9px] font-black text-slate-400 uppercase block mb-1">Fecha de Operación:</span>
                                        <p className="font-extrabold text-slate-800 font-mono">{new Date(selectedRecibo.fecha + 'T12:00:00').toLocaleDateString('es-DO', { day: '2-digit', month: '2-digit', year: 'numeric' })}</p>
                                        <span className="text-[9px] font-black text-[#FF1493] uppercase block mt-1">Folio N°: REC-{(selectedRecibo.id || '000').substring(0, 8).toUpperCase()}</span>
                                    </div>
                                </div>
                                <div className="bg-[#002147] p-6 rounded-2xl text-white shadow-lg space-y-3">
                                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                        <div>
                                            <p className="text-[9px] font-bold uppercase opacity-80">Método de Pago</p>
                                            <p className="font-black uppercase text-[13px] sm:text-sm">{selectedRecibo.metodo}</p>
                                        </div>
                                        <div className="text-left sm:text-right w-full sm:w-auto">
                                            <p className="text-[9px] font-bold uppercase opacity-80">Monto Total</p>
                                            <p className="font-black uppercase text-base sm:text-lg font-mono break-all sm:break-normal">RD$ {selectedRecibo.monto?.toLocaleString()}</p>
                                        </div>
                                    </div>
                                    {selectedRecibo.concepto && (
                                        <div className="bg-white/15 rounded-xl px-4 py-3 text-xs font-bold text-white/90 text-center border border-white/20">
                                            📋 {selectedRecibo.concepto}
                                        </div>
                                    )}
                                </div>

                            </div>
                        </div>
                    </Card>
                </div>
            )}

            {/* FICHA DIGITAL — DISEÑO DOCUMENTO IMPRIMIBLE */}
            {selectedStudentForFile && (() => {
                const studentPayments = recibos.filter((r: any) => r.estudiante_id === selectedStudentForFile.id);
                const isUpToDate = currentSaldo <= 0;
                const totalPagado = studentPayments.reduce((sum: number, p: any) => sum + (p.monto || 0), 0);
                const today = new Date().toLocaleDateString('es-DO', { day: 'numeric', month: 'numeric', year: 'numeric' });
                const getConcepto = (p: any) => {
                    if (p.concepto) return p.concepto;
                    const d = new Date(p.fecha + 'T12:00:00');
                    return `Cuota ${d.toLocaleDateString('es-DO', { month: 'long', year: 'numeric' })}`;
                };

                return (
                    <div className="fixed inset-0 z-[200] bg-white overflow-y-auto print:overflow-visible">
                        {/* CSS SOLO para impresión */}
                        <style>{`
                            @media print {
                                body * { visibility: hidden !important; }
                                #ficha-print, #ficha-print * { visibility: visible !important; }
                                #ficha-print { position: fixed !important; left: 0; top: 0; width: 100%; padding: 32px 40px; }
                                #ficha-action-bar { display: none !important; }
                            }
                        `}</style>

                        {/* BARRA DE ACCIONES — solo en pantalla */}
                        <div id="ficha-action-bar" className="sticky top-0 bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between z-10 print:hidden">
                            <button
                                onClick={() => setSelectedStudentForFile(null)}
                                className="flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-gray-800 transition-colors"
                            >
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4"><path d="M19 12H5M12 5l-7 7 7 7" /></svg>
                                Volver al Portal
                            </button>
                            <button
                                onClick={() => window.print()}
                                className="flex items-center gap-2 bg-gray-900 hover:bg-gray-700 text-white text-sm font-bold px-5 py-2 rounded-full transition-colors"
                            >
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4"><polyline points="6 9 6 2 18 2 18 9" /><path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2" /><rect x="6" y="14" width="12" height="8" /></svg>
                                Imprimir / Guardar PDF
                            </button>
                        </div>

                        {/* DOCUMENTO IMPRIMIBLE */}
                        <div id="ficha-print" className="max-w-3xl mx-auto py-12 px-10 print:py-0">

                            {/* CABECERA DOCUMENTO */}
                            <div className="flex justify-between items-start mb-10 border-b-4 border-slate-900 pb-8">
                                <div className="flex gap-6 items-center">
                                    <div className="bg-slate-50 p-3 rounded-[28px] shadow-sm border border-slate-100">
                                        <img src="https://informativolatelefonica.com/wp-content/uploads/2026/03/LOGO.png" alt="Logo" className="h-20 w-20 object-contain" />
                                    </div>
                                    <div>
                                        <h1 className="text-xl md:text-2xl font-black text-slate-900 leading-tight tracking-tighter uppercase">
                                            Pre-escolar Psicopedagógico<br />De la Sagrada Familia
                                        </h1>
                                        <div className="mt-2 text-[11px] font-mono text-slate-500 space-y-0.5">
                                            <p>RNC: 131596152</p>
                                            <p className="flex items-center gap-1"><MapPin className="h-3 w-3" /> Alma Rosa I, Santo Domingo Este</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <Badge className="bg-slate-900 text-white font-black px-4 py-1.5 rounded-full border-0 mb-2 uppercase text-[10px]">Expediente Digital</Badge>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">ID: ST-{(selectedStudentForFile.id || '000').substring(0, 8).toUpperCase()}</p>
                                </div>
                            </div>

                            {/* GRID DE INFORMACIÓN PRINCIPAL */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
                                {/* Datos del Estudiante */}
                                <div className="bg-slate-50 rounded-[35px] p-8 border border-slate-100">
                                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-[#8A2BE2] mb-6 flex items-center gap-2">
                                        <User className="h-4 w-4" /> Datos del Alumno
                                    </h3>
                                    <div className="space-y-4">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-bold text-slate-400 uppercase">Nombre Completo</span>
                                            <span className="text-xl font-black text-slate-900 tracking-tight">{selectedStudentForFile.nombre}</span>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-bold text-slate-400 uppercase">Grado / Nivel</span>
                                            <span className="text-lg font-black text-slate-700">{selectedStudentForFile.grado}</span>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-bold text-slate-400 uppercase">Cuota Mensual</span>
                                            <span className="text-lg font-black text-[#002147]">RD$ {selectedStudentForFile.cuota_mensual ? Number(selectedStudentForFile.cuota_mensual).toLocaleString('es-DO') : "—"}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Datos de Contacto y Estatus */}
                                <div className="bg-[#F0F4F8]/10 rounded-[35px] p-8 border border-[#F0F4F8]/20">
                                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-sky-700 mb-6 flex items-center gap-2">
                                        <Phone className="h-4 w-4" /> Contacto Tutor
                                    </h3>
                                    <div className="space-y-4">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-bold text-slate-400 uppercase">Padre / Tutor</span>
                                            <span className="text-xl font-black text-slate-900 tracking-tight">
                                                {selectedStudentForFile.tutor_nombre || selectedStudentForFile.nombre_madre || userName}
                                            </span>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-bold text-slate-400 uppercase">Teléfono de Enlace</span>
                                            <span className="text-lg font-black text-slate-700">
                                                {selectedStudentForFile.telefono_tutor || selectedStudentForFile.telefono_madre || selectedStudentForFile.padre_telefono || <span className="text-sm text-slate-400 font-medium italic">Pendiente de actualizar</span>}
                                            </span>
                                        </div>
                                        <div className="pt-2">
                                            {isUpToDate ? (
                                                <Badge className="px-4 py-2 rounded-full font-black uppercase text-[11px] bg-sky-600 text-white border-none shadow-md">
                                                    ✓ Estado: Al Día
                                                </Badge>
                                            ) : (studentPayments.some((p: any) => p.estado === 'en_revision')) ? (
                                                <Badge className="px-4 py-2 rounded-full font-black uppercase text-[11px] bg-blue-600 text-white border-none shadow-md animate-pulse">
                                                    ⌛ Verificando Pago
                                                </Badge>
                                            ) : (
                                                <Badge className="px-4 py-2 rounded-full font-black uppercase text-[11px] bg-[#ffcc00] text-black border-none shadow-md">
                                                    ⚠️ Pago Pendiente
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* HISTORIAL FINANCIERO */}
                            <div className="mb-10">
                                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 mb-4 px-4">Historial Reciente de Pagos</h3>
                                <div className="border border-slate-100 rounded-[35px] overflow-hidden shadow-sm overflow-x-auto w-full">
                                    <table className="w-full text-sm min-w-[500px]">
                                        <thead>
                                            <tr className="bg-slate-50 border-b border-slate-100 text-left">
                                                <th className="px-6 py-4 font-black text-slate-500 uppercase text-[9px]">Fecha</th>
                                                <th className="px-6 py-4 font-black text-slate-500 uppercase text-[9px]">Concepto / Detalle</th>
                                                <th className="px-6 py-4 font-black text-slate-500 uppercase text-[9px]">Monto</th>
                                                <th className="px-6 py-4 font-black text-slate-500 uppercase text-[9px] text-right">Estatus</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50">
                                            {studentPayments.length > 0 ? studentPayments.slice(0, 5).map((p: any) => (
                                                <tr key={p.id} className="bg-white">
                                                    <td className="px-6 py-4 font-bold text-slate-500">{new Date(p.fecha + 'T12:00:00').toLocaleDateString('es-DO')}</td>
                                                    <td className="px-6 py-4">
                                                        <p className="font-black text-slate-800 text-xs truncate max-w-[200px]">{getConcepto(p)}</p>
                                                        <p className="text-[9px] font-bold text-slate-400 uppercase">Vía {p.metodo || '—'}</p>
                                                    </td>
                                                    <td className="px-6 py-4 font-black text-slate-900">RD$ {p.monto?.toLocaleString('es-DO')}</td>
                                                    <td className="px-6 py-4 text-right">
                                                        <span className="text-[10px] font-black text-sky-600 uppercase italic">Saldado ✓</span>
                                                    </td>
                                                </tr>
                                            )) : (
                                                <tr>
                                                    <td colSpan={4} className="px-6 py-12 text-center text-slate-300 font-bold italic">No se registran transacciones previas</td>
                                                </tr>
                                            )}
                                        </tbody>
                                        {studentPayments.length > 0 && (
                                            <tfoot className="bg-slate-900 text-white">
                                                <tr>
                                                    <td colSpan={2} className="px-6 py-5 font-black uppercase text-[10px] tracking-widest text-white/60">Balance Total Acumulado</td>
                                                    <td className="px-6 py-5 font-black text-xl tracking-tighter">RD$ {totalPagado.toLocaleString('es-DO')}</td>
                                                    <td className="px-6 py-5"></td>
                                                </tr>
                                            </tfoot>
                                        )}
                                    </table>
                                </div>
                            </div>

                            {/* FIRMA Y SELLOS */}
                            <div className="grid grid-cols-2 gap-12 mt-16 pt-10 border-t border-slate-100">
                                <div className="text-center">
                                    <div className="h-0.5 w-full bg-slate-200 mb-4" />
                                    <p className="text-[10px] font-black uppercase text-slate-800">Dirección Administrativa</p>
                                    <p className="text-[9px] font-bold text-slate-400">Sagrada Familia Education Group</p>
                                </div>
                                <div className="text-center relative">
                                    <div className="absolute -top-12 left-1/2 -translate-x-1/2 opacity-10">
                                        <img src="https://informativolatelefonica.com/wp-content/uploads/2026/03/LOGO.png" className="h-24 w-24 grayscale" />
                                    </div>
                                    <div className="h-0.5 w-full bg-slate-200 mb-4" />
                                    <p className="text-[10px] font-black uppercase text-slate-800">Sello Digital de Validación</p>
                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Kinder Hive Hub — {today}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            })()}

            {/* === BOTÓN FLOTANTE DE CONTACTO === */}
            <div className="fixed bottom-8 right-6 z-[90]">
                <button
                    onClick={() => { setShowContact(true); setContactTab("menu"); setCitaOk(false); }}
                    className="flex items-center gap-3 bg-[#25D366] hover:bg-[#1ebe5d] text-white font-black px-6 py-4 rounded-full shadow-2xl shadow-[#25D366]/40 transition-all hover:scale-105 active:scale-95"
                >
                    <svg viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>
                    Contactar al Colegio
                </button>
            </div>

            {/* === MODAL DE CONTACTO === */}
            {showContact && (
                <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-200">
                    <div className="w-full max-w-md bg-white rounded-[40px] shadow-2xl overflow-hidden animate-in slide-in-from-bottom-5 duration-300">
                        <div className="bg-gradient-to-r from-[#002147] to-[#8A2BE2] p-8 text-white relative">
                            <button onClick={() => setShowContact(false)} className="absolute top-5 right-5 text-white/60 hover:text-white transition-colors text-2xl font-black">✕</button>
                            <div className="flex items-center gap-4">
                                <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-sm">
                                    <img src="https://informativolatelefonica.com/wp-content/uploads/2026/03/LOGO.png" className="h-12 w-12 object-contain" alt="Logo" />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-black tracking-tighter">Contacto Directo</h3>
                                    <p className="text-white/70 text-sm font-bold">Pre-escolar Sagrada Familia</p>
                                </div>
                            </div>
                        </div>
                        <div className="p-8">
                            {contactTab === "menu" && (
                                <div className="space-y-4">
                                    <a href={`https://wa.me/18095550100?text=Hola,%20soy%20${encodeURIComponent(userName)},%20padre%2Fmadre%20de%20${encodeURIComponent(estudiantes[0]?.nombre || 'un alumno')}%20y%20quisiera%20consultar%20algo.`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 p-5 bg-[#25D366]/10 hover:bg-[#25D366]/20 rounded-[24px] transition-all group cursor-pointer">
                                        <div className="h-14 w-14 bg-[#25D366] rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                                            <svg viewBox="0 0 24 24" fill="white" className="h-7 w-7"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>
                                        </div>
                                        <div>
                                            <p className="font-black text-slate-800 text-base">WhatsApp</p>
                                            <p className="text-xs font-bold text-slate-400">Respuesta en minutos</p>
                                        </div>
                                    </a>
                                    <a href={`mailto:admin@sagradafamilia.edu.do?subject=Consulta sobre ${encodeURIComponent(estudiantes[0]?.nombre || 'alumno')}&body=Estimada dirección,%0A%0ASoy ${encodeURIComponent(userName)} y quisiera...`} className="flex items-center gap-4 p-5 bg-[#002147]/10 hover:bg-[#002147]/20 rounded-[24px] transition-all group cursor-pointer">
                                        <div className="h-14 w-14 bg-[#002147] rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                                            <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" className="h-7 w-7"><path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                                        </div>
                                        <div>
                                            <p className="font-black text-slate-800 text-base">Enviar Correo</p>
                                            <p className="text-xs font-bold text-slate-400">admin@sagradafamilia.edu.do</p>
                                        </div>
                                    </a>
                                    <button onClick={() => setContactTab("cita")} className="w-full flex items-center gap-4 p-5 bg-[#8A2BE2]/10 hover:bg-[#8A2BE2]/20 rounded-[24px] transition-all group text-left">
                                        <div className="h-14 w-14 bg-[#8A2BE2] rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                                            <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" className="h-7 w-7"><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></svg>
                                        </div>
                                        <div>
                                            <p className="font-black text-slate-800 text-base">Solicitar Reunión</p>
                                            <p className="text-xs font-bold text-slate-400">Agenda una cita con la dirección</p>
                                        </div>
                                    </button>
                                </div>
                            )}
                            {contactTab === "cita" && !citaOk && (
                                <form onSubmit={(e) => { e.preventDefault(); setCitaOk(true); }} className="space-y-4">
                                    <button type="button" onClick={() => setContactTab("menu")} className="text-[#8A2BE2] font-black text-sm mb-2">← Volver</button>
                                    <h4 className="text-xl font-black text-slate-800">Solicitar Reunión</h4>
                                    <div>
                                        <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Fecha Preferida</label>
                                        <input type="date" required min={new Date().toISOString().split('T')[0]} className="w-full mt-1 h-12 px-4 rounded-2xl border-2 border-slate-100 font-bold text-slate-700 focus:border-[#8A2BE2] outline-none" />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Hora</label>
                                        <select className="w-full mt-1 h-12 px-4 rounded-2xl border-2 border-slate-100 font-bold bg-white focus:border-[#8A2BE2] outline-none">
                                            <option>8:00 AM</option>
                                            <option>9:00 AM</option>
                                            <option>10:00 AM</option>
                                            <option>11:00 AM</option>
                                            <option>2:00 PM</option>
                                            <option>3:00 PM</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Motivo de la reunión</label>
                                        <textarea rows={3} required className="w-full mt-1 p-4 rounded-3xl border-2 border-slate-100 font-medium text-slate-700 focus:border-[#8A2BE2] outline-none" placeholder="Explique brevemente el motivo..."></textarea>
                                    </div>
                                    <button type="submit" className="w-full h-14 bg-[#8A2BE2] hover:bg-[#7726c5] text-white font-black rounded-2xl shadow-lg shadow-[#8A2BE2]/20">
                                        Confirmar Solicitud
                                    </button>
                                </form>
                            )}
                            {contactTab === "cita" && citaOk && (
                                <div className="text-center py-8 space-y-4">
                                    <div className="h-20 w-20 bg-sky-50 rounded-full flex items-center justify-center mx-auto">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="3" className="h-10 w-10"><polyline points="20 6 9 17 4 12" /></svg>
                                    </div>
                                    <h4 className="text-2xl font-black text-slate-800">¡Solicitud Enviada!</h4>
                                    <p className="text-slate-500 font-medium">La administración se pondrá en contacto contigo para confirmar la cita.</p>
                                    <button onClick={() => setShowContact(false)} className="mt-4 px-8 py-3 bg-slate-100 hover:bg-slate-200 rounded-full font-black text-slate-600">Cerrar</button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* === MODAL REPORTAR PAGO === */}
            {showReportarModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-200">
                    <div className="w-full max-w-md bg-white rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="bg-gradient-to-r from-[#8A2BE2] to-[#002147] p-8 text-white">
                            <h3 className="text-2xl font-black tracking-tighter italic uppercase">Reportar Transferencia</h3>
                            <p className="text-white/70 text-[10px] font-bold uppercase tracking-widest">Notificar depósito o transferencia bancaria</p>
                        </div>
                        <form onSubmit={handleReportSubmit} className="p-8 space-y-5">
                            <div>
                                <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Estudiante</label>
                                <select 
                                    className="w-full mt-1 h-12 px-4 rounded-2xl border-2 border-slate-100 font-bold bg-white outline-none focus:border-[#8A2BE2]"
                                    value={reportData.estudiante_id}
                                    onChange={(e) => setReportData({...reportData, estudiante_id: e.target.value})}
                                    required
                                >
                                    {estudiantes.map((est: any) => (
                                        <option key={est.id} value={est.id}>{est.nombre}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Monto Pagado (RD$)</label>
                                <input 
                                    type="number" 
                                    required 
                                    className="w-full mt-1 h-12 px-4 rounded-2xl border-2 border-slate-100 font-black text-lg outline-none focus:border-[#8A2BE2]"
                                    placeholder="Ej: 11000"
                                    value={reportData.monto}
                                    onChange={(e) => setReportData({...reportData, monto: e.target.value})}
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Concepto</label>
                                <input 
                                    type="text" 
                                    className="w-full mt-1 h-12 px-4 rounded-2xl border-2 border-slate-100 font-bold text-slate-700 outline-none focus:border-[#8A2BE2]"
                                    value={reportData.concepto}
                                    onChange={(e) => setReportData({...reportData, concepto: e.target.value})}
                                />
                            </div>
                            
                            <div className="bg-amber-50 rounded-2xl p-4 border border-amber-100">
                                <p className="text-[10px] text-amber-700 font-bold leading-relaxed">
                                    <AlertTriangle className="h-3 w-3 inline mr-1 mb-0.5" />
                                    Una vez registrado, podrás subir la foto del comprobante desde tu historial para que sea aprobado.
                                </p>
                            </div>

                            <div className="flex gap-3 pt-2">
                                <Button 
                                    type="button" 
                                    variant="outline" 
                                    className="flex-1 h-12 rounded-2xl font-black text-slate-400 border-slate-100"
                                    onClick={() => setShowReportarModal(false)}
                                >
                                    Cancelar
                                </Button>
                                <Button 
                                    type="submit" 
                                    disabled={isReporting}
                                    className="flex-[2] h-12 rounded-2xl bg-[#8A2BE2] hover:bg-[#7726c5] text-white font-black shadow-lg"
                                >
                                    {isReporting ? "Procesando..." : "Registrar Reporte"}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            {/* === MODAL DE FOTO (AMPLIAR) === */}
            {showPhotoModal && selectedPhoto && (
                <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-xl animate-in fade-in duration-200" onClick={() => setShowPhotoModal(false)}>
                    <div className="relative w-full max-w-4xl bg-white rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300" onClick={(e) => e.stopPropagation()}>
                        <button onClick={() => setShowPhotoModal(false)} className="absolute top-6 right-6 z-10 bg-black/20 hover:bg-black/40 text-white p-2 rounded-full backdrop-blur-md transition-colors font-black">✕</button>
                        <div className="flex flex-col md:flex-row h-full max-h-[90vh]">
                            <div className="md:w-2/3 bg-black flex items-center justify-center overflow-hidden">
                                <img src={selectedPhoto.foto_url} alt={selectedPhoto.titulo} className="w-full h-full object-contain" />
                            </div>
                            <div className="md:w-1/3 p-10 flex flex-col justify-center bg-white">
                                <Badge className="bg-[#ffcc00] text-black font-black text-[10px] uppercase px-4 py-1 rounded-full w-fit mb-6">Actividad Escolar</Badge>
                                <h3 className="text-3xl font-black text-slate-800 italic uppercase tracking-tighter leading-tight mb-4">{selectedPhoto.titulo}</h3>
                                <p className="text-slate-500 font-bold leading-relaxed mb-8">{selectedPhoto.descripcion || "Sin descripción adicional."}</p>
                                <div className="pt-8 border-t border-slate-100 flex items-center gap-4">
                                    <div className="h-12 w-12 rounded-2xl bg-[#F0F4F8] flex items-center justify-center text-white shadow-lg">
                                        <ImageIcon className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase">Publicado el</p>
                                        <p className="font-black text-slate-800 uppercase italic tracking-tighter">{new Date(selectedPhoto.created_at).toLocaleDateString('es-DO', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}



