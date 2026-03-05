import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Calendar, FileText, Image, Cake, Bell, MessageSquare, Sparkles, Clock, MapPin, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { AlertBanner } from "@/components/AlertBanner";
import type { Tables } from "@/integrations/supabase/types";

const WEBHOOK_URL = "https://curso-n8n-n8n.sjia2i.easypanel.host/webhook/frase-del-dia";

export default function DashboardHome() {
  const { user, isAuthenticated } = useAuth();
  const [messageOfDay, setMessageOfDay] = useState<string>("");
  const [messageType, setMessageType] = useState<string>("motivacional");
  const [loadingMessage, setLoadingMessage] = useState(true);
  const [eventos, setEventos] = useState<Tables<"eventos">[]>([]);
  const [comunicados, setComunicados] = useState<Tables<"comunicados">[]>([]);
  const [notas, setNotas] = useState<(Tables<"notas_maestras"> & { estudiante_nombre?: string })[]>([]);
  const [cumpleanos, setCumpleanos] = useState<Tables<"cumpleanos">[]>([]);
  const [alertas, setAlertas] = useState<Tables<"alertas">[]>([]);
  const [fotos, setFotos] = useState<Tables<"galeria">[]>([]);
  const [agradecimientos, setAgradecimientos] = useState<Tables<"agradecimientos">[]>([]);

  useEffect(() => {
    fetchData();
    fetchMessage();
  }, []);

  const fetchData = async () => {
    const [evRes, comRes, notRes, cumRes, alRes, fotRes, agrRes] = await Promise.all([
      supabase.from("eventos").select("*").order("fecha", { ascending: false }).limit(5),
      supabase.from("comunicados").select("*").order("created_at", { ascending: false }).limit(5),
      supabase.from("notas_maestras").select("*, estudiantes(nombre)").order("created_at", { ascending: false }).limit(5),
      supabase.from("cumpleanos").select("*").order("fecha", { ascending: true }),
      supabase.from("alertas").select("*").eq("activa", true),
      supabase.from("galeria").select("*").order("created_at", { ascending: false }).limit(4),
      supabase.from("agradecimientos").select("*").order("created_at", { ascending: false }).limit(3),
    ]);
    if (evRes.data) setEventos(evRes.data);
    if (comRes.data) setComunicados(comRes.data);
    if (notRes.data) setNotas(notRes.data.map((n: any) => ({ ...n, estudiante_nombre: n.estudiantes?.nombre })));
    if (cumRes.data) setCumpleanos(cumRes.data);
    if (alRes.data) setAlertas(alRes.data);
    if (fotRes.data) setFotos(fotRes.data);
    if (agrRes.data) setAgradecimientos(agrRes.data);
  };

  const fetchMessage = async () => {
    try {
      // Try DB first
      const today = new Date().toISOString().split("T")[0];
      const { data: dbMsg } = await supabase.from("mensaje_dia").select("*").eq("fecha_iso", today).limit(1).maybeSingle();
      if (dbMsg) {
        setMessageOfDay(dbMsg.contenido);
        setMessageType(dbMsg.tipo_mensaje || "motivacional");
        setLoadingMessage(false);
        return;
      }
      // Fallback to webhook
      const res = await fetch(WEBHOOK_URL);
      if (res.ok) {
        const data = await res.json();
        const content = data.contenido || data.message || data.frase || "¡Cada día es una nueva oportunidad para aprender! 🌟";
        setMessageOfDay(content);
        setMessageType(data.tipo_mensaje || "motivacional");
      } else {
        setMessageOfDay("¡Cada día es una nueva oportunidad para aprender! 🌟");
      }
    } catch {
      setMessageOfDay("¡Cada día es una nueva oportunidad para aprender! 🌟");
    } finally {
      setLoadingMessage(false);
    }
  };

  // Current month birthdays
  const currentMonth = new Date().getMonth() + 1;
  const birthdaysThisMonth = cumpleanos.filter(c => {
    const m = new Date(c.fecha).getMonth() + 1;
    return m === currentMonth;
  });

  const kpis = [
    { label: "Eventos", value: eventos.length, icon: Calendar, color: "bg-accent text-accent-foreground" },
    { label: "Comunicados", value: comunicados.length, icon: FileText, color: "bg-success text-success-foreground" },
    { label: "Fotos", value: fotos.length, icon: Image, color: "bg-warning text-warning-foreground" },
    { label: "Cumpleaños", value: birthdaysThisMonth.length, icon: Cake, color: "bg-info text-info-foreground" },
    { label: "Avisos", value: alertas.length, icon: Bell, color: "bg-urgent text-urgent-foreground" },
    { label: "Notas", value: notas.length, icon: MessageSquare, color: "bg-primary text-primary-foreground" },
  ];

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <AlertBanner />

      {/* Welcome Banner */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl p-6 bg-gradient-to-r from-amber-100 via-orange-50 to-yellow-100 dark:from-amber-900/30 dark:via-orange-900/20 dark:to-yellow-900/30 border border-amber-200 dark:border-amber-800 shadow-lg">
        <div className="flex items-center gap-4">
          <span className="text-5xl">👨‍👩‍👧‍👦</span>
          <div>
            <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground">
              {isAuthenticated ? `¡Buen día, ${user?.displayName}! 👋` : "¡Hola, Padres y Madres! 👋"}
            </h1>
            <p className="text-muted-foreground mt-1 text-lg">
              Bienvenidos al <span className="font-bold text-foreground">Pre-escolar Psicopedagógico de la Sagrada Familia</span>
            </p>
          </div>
        </div>
      </motion.div>

      {/* Message of the Day */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="gradient-warm rounded-xl p-6 text-primary-foreground shadow-glow">
        <div className="flex items-start gap-3">
          <Sparkles className="w-6 h-6 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="font-display font-bold text-sm uppercase tracking-wide opacity-80 mb-1">
              {messageType === "efemeride" ? "Efeméride del día" : "Frase del día"}
            </h3>
            {loadingMessage ? (
              <div className="h-5 w-64 bg-primary-foreground/20 rounded animate-pulse" />
            ) : (
              <p className="text-lg font-medium leading-relaxed">{messageOfDay}</p>
            )}
          </div>
        </div>
      </motion.div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {kpis.map((kpi, i) => (
          <motion.div key={kpi.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 + i * 0.05 }}
            className="bg-card rounded-xl p-4 shadow-card border border-border text-center">
            <div className={`inline-flex items-center justify-center w-10 h-10 rounded-lg ${kpi.color} mb-2`}>
              <kpi.icon className="w-5 h-5" />
            </div>
            <p className="text-2xl font-display font-bold text-foreground">{kpi.value}</p>
            <p className="text-xs text-muted-foreground">{kpi.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Recent Events + Recent Notes */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Recent Events */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          className="bg-card rounded-xl p-5 shadow-card border border-border">
          <div className="flex items-center gap-2 mb-3">
            <Calendar className="w-4 h-4 text-accent" />
            <h3 className="font-display font-bold text-foreground">Eventos Recientes</h3>
          </div>
          {eventos.length === 0 ? (
            <p className="text-sm text-muted-foreground">No hay eventos aún</p>
          ) : (
            <ul className="space-y-2">
              {eventos.slice(0, 4).map(ev => (
                <li key={ev.id} className="text-sm p-3 rounded-lg bg-muted">
                  <span className="font-semibold text-foreground">{ev.titulo}</span>
                  <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> {ev.fecha}
                    </span>
                    {ev.hora && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {ev.hora}
                      </span>
                    )}
                    {ev.ubicacion && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> {ev.ubicacion}
                      </span>
                    )}
                  </div>
                  {ev.descripcion && <p className="text-xs text-muted-foreground mt-1">{ev.descripcion}</p>}
                </li>
              ))}
            </ul>
          )}
        </motion.div>

        {/* Recent Teacher Notes */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}
          className="bg-card rounded-xl p-5 shadow-card border border-border">
          <div className="flex items-center gap-2 mb-3">
            <MessageSquare className="w-4 h-4 text-primary" />
            <h3 className="font-display font-bold text-foreground">Notas Recientes</h3>
          </div>
          {notas.length === 0 ? (
            <p className="text-sm text-muted-foreground">No hay notas aún</p>
          ) : (
            <ul className="space-y-2">
              {notas.slice(0, 4).map(n => (
                <li key={n.id} className="text-sm p-3 rounded-lg bg-muted">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-foreground">{n.estudiante_nombre || "Estudiante"}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-accent text-accent-foreground capitalize">{n.categoria}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{n.contenido}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">{n.fecha} — {n.maestro_nombre || "Maestra"}</p>
                </li>
              ))}
            </ul>
          )}
        </motion.div>
      </div>

      {/* Comunicados completos + Agradecimientos */}
      <div className="grid md:grid-cols-2 gap-4">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
          className="bg-card rounded-xl p-5 shadow-card border border-border">
          <div className="flex items-center gap-2 mb-3">
            <FileText className="w-4 h-4 text-success" />
            <h3 className="font-display font-bold text-foreground">Últimos Comunicados</h3>
          </div>
          {comunicados.length === 0 ? (
            <p className="text-sm text-muted-foreground">No hay comunicados aún</p>
          ) : (
            <ul className="space-y-3">
              {comunicados.slice(0, 3).map(c => (
                <li key={c.id} className="p-3 rounded-lg bg-muted">
                  <span className="font-semibold text-foreground text-sm">{c.titulo}</span>
                  <p className="text-xs text-muted-foreground mt-1 whitespace-pre-wrap">{c.contenido}</p>
                  <span className="text-[10px] text-muted-foreground block mt-1">{c.fecha}</span>
                </li>
              ))}
            </ul>
          )}
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }}
          className="bg-card rounded-xl p-5 shadow-card border border-border">
          <div className="flex items-center gap-2 mb-3">
            <Users className="w-4 h-4 text-warning" />
            <h3 className="font-display font-bold text-foreground">Agradecimientos</h3>
          </div>
          {agradecimientos.length === 0 ? (
            <p className="text-sm text-muted-foreground">No hay agradecimientos aún</p>
          ) : (
            <ul className="space-y-2">
              {agradecimientos.slice(0, 3).map(t => (
                <li key={t.id} className="text-sm p-3 rounded-lg bg-muted">
                  <span className="text-foreground">"{t.mensaje}"</span>
                  <span className="text-muted-foreground block text-xs mt-1">— {t.autor}</span>
                </li>
              ))}
            </ul>
          )}
        </motion.div>
      </div>

      {/* Birthday preview */}
      {birthdaysThisMonth.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
          className="bg-card rounded-xl p-5 shadow-card border border-border">
          <div className="flex items-center gap-2 mb-3">
            <Cake className="w-4 h-4 text-warning" />
            <h3 className="font-display font-bold text-foreground">🎉 Cumpleañeros del Mes</h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {birthdaysThisMonth.map(b => (
              <div key={b.id} className="text-center p-3 rounded-lg bg-muted">
                {b.foto_url ? (
                  <img src={b.foto_url} alt={b.nombre} className="w-16 h-16 rounded-full mx-auto mb-2 object-cover" />
                ) : (
                  <span className="text-3xl block mb-1">{b.emoji || "🎂"}</span>
                )}
                <p className="font-semibold text-foreground text-sm">{b.nombre}</p>
                <p className="text-[10px] text-muted-foreground">{b.fecha}</p>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
