import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Calendar, FileText, Image, Cake, Bell, MessageSquare, Sparkles, Clock, MapPin, Users, DollarSign, UserCheck, ClipboardList } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { AlertBanner } from "@/components/AlertBanner";
import { WelcomeModal } from "@/components/WelcomeModal";
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

  // Dynamic counts
  const [counts, setCounts] = useState({ eventos: 0, comunicados: 0, fotos: 0, cumpleanos: 0, alertas: 0, notas: 0 });

  // Directora pending tasks
  const [pendingPayments, setPendingPayments] = useState(0);
  const [pendingUsers, setPendingUsers] = useState(0);

  // Welcome modal
  const [showWelcome, setShowWelcome] = useState(false);

  const fetchCounts = useCallback(async () => {
    const [evC, comC, fotC, cumC, alC, notC] = await Promise.all([
      supabase.from("eventos").select("id", { count: "exact", head: true }),
      supabase.from("comunicados").select("id", { count: "exact", head: true }),
      supabase.from("galeria").select("id", { count: "exact", head: true }),
      supabase.from("cumpleanos").select("id", { count: "exact", head: true }),
      supabase.from("alertas").select("id", { count: "exact", head: true }).eq("activa", true),
      supabase.from("notas_maestras").select("id", { count: "exact", head: true }),
    ]);
    setCounts({
      eventos: evC.count || 0,
      comunicados: comC.count || 0,
      fotos: fotC.count || 0,
      cumpleanos: cumC.count || 0,
      alertas: alC.count || 0,
      notas: notC.count || 0,
    });
  }, []);

  useEffect(() => {
    fetchData();
    fetchMessage();
    checkFirstVisit();
    fetchCounts();
    if (user?.role === "directora") fetchPendingTasks();
  }, [user]);

  // Realtime subscriptions
  useEffect(() => {
    const channel = supabase
      .channel("dashboard-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "comunicados" }, () => { fetchData(); fetchCounts(); })
      .on("postgres_changes", { event: "*", schema: "public", table: "notas_maestras" }, () => { fetchData(); fetchCounts(); })
      .on("postgres_changes", { event: "*", schema: "public", table: "galeria" }, () => { fetchData(); fetchCounts(); })
      .on("postgres_changes", { event: "*", schema: "public", table: "cumpleanos" }, () => { fetchData(); fetchCounts(); })
      .on("postgres_changes", { event: "*", schema: "public", table: "alertas" }, () => { fetchData(); fetchCounts(); })
      .on("postgres_changes", { event: "*", schema: "public", table: "eventos" }, () => { fetchData(); fetchCounts(); })
      .on("postgres_changes", { event: "*", schema: "public", table: "agradecimientos" }, () => { fetchData(); fetchCounts(); })
      .on("postgres_changes", { event: "*", schema: "public", table: "pagos" }, () => {
        if (user?.role === "directora") fetchPendingTasks();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user?.role]);

  const checkFirstVisit = () => {
    if (!user) return;
    const key = `educonnect_welcome_staff_${user.id}`;
    if (!localStorage.getItem(key)) {
      setShowWelcome(true);
      localStorage.setItem(key, "true");
    }
  };

  const fetchPendingTasks = async () => {
    const [payRes, userRes] = await Promise.all([
      supabase.from("pagos").select("id", { count: "exact", head: true }).eq("estado", "por_revisar"),
      supabase.from("user_roles").select("id", { count: "exact", head: true }).eq("role", "pendiente"),
    ]);
    setPendingPayments(payRes.count || 0);
    setPendingUsers(userRes.count || 0);
  };

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
      const today = new Date().toISOString().split("T")[0];
      const { data: dbMsg } = await supabase.from("mensaje_dia").select("*").eq("fecha_iso", today).limit(1).maybeSingle();
      if (dbMsg) {
        setMessageOfDay(dbMsg.contenido);
        setMessageType(dbMsg.tipo_mensaje || "motivacional");
        setLoadingMessage(false);
        return;
      }
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

  const currentMonth = new Date().getMonth() + 1;
  const birthdaysThisMonth = cumpleanos.filter(c => new Date(c.fecha).getMonth() + 1 === currentMonth);

  const kpis = [
    { label: "Eventos", value: counts.eventos, icon: Calendar, color: "bg-accent text-accent-foreground" },
    { label: "Comunicados", value: counts.comunicados, icon: FileText, color: "bg-success text-success-foreground" },
    { label: "Fotos", value: counts.fotos, icon: Image, color: "bg-warning text-warning-foreground" },
    { label: "Cumpleaños", value: counts.cumpleanos, icon: Cake, color: "bg-info text-info-foreground" },
    { label: "Avisos", value: counts.alertas, icon: Bell, color: "bg-urgent text-urgent-foreground" },
    { label: "Notas", value: counts.notas, icon: MessageSquare, color: "bg-primary text-primary-foreground" },
  ];

  const hasPendingTasks = pendingPayments > 0 || pendingUsers > 0;

  // Check for urgent comunicados
  const hasUrgentAlerts = alertas.some(a => a.prioridad === "urgent" && a.activa);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {showWelcome && user && (
        <WelcomeModal
          name={user.displayName}
          onDismiss={() => setShowWelcome(false)}
          onAction={() => setShowWelcome(false)}
          variant="staff"
        />
      )}

      <AlertBanner />

      {/* Welcome Banner */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl p-6 bg-gradient-to-r from-amber-100 via-orange-50 to-yellow-100 dark:from-amber-900/30 dark:via-orange-900/20 dark:to-yellow-900/30 border border-amber-200 dark:border-amber-800 shadow-lg">
        <div className="flex items-center gap-4">
          <span className="text-5xl">{user?.role === "directora" ? "👑" : "🧑‍🏫"}</span>
          <div>
            <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground">
              ¡Buen día, {user?.displayName}! 👋
            </h1>
            <p className="text-muted-foreground mt-1 text-lg font-body">
              Es un gusto tenerte aquí hoy — <span className="font-bold text-foreground">Pre-escolar Psicopedagógico de la Sagrada Familia</span>
            </p>
          </div>
        </div>
      </motion.div>

      {/* Urgent Alert Pulse */}
      {hasUrgentAlerts && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="rounded-xl p-4 border-2 border-destructive animate-pulse bg-destructive/5">
          <div className="flex items-center gap-3">
            <Bell className="w-5 h-5 text-destructive" />
            <div>
              <p className="font-display font-bold text-destructive">⚠️ Avisos Urgentes Activos</p>
              <p className="text-sm text-muted-foreground">
                {alertas.filter(a => a.prioridad === "urgent" && a.activa).map(a => a.titulo).join(" • ")}
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Directora: Pending Tasks */}
      {user?.role === "directora" && hasPendingTasks && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          className="bg-card rounded-xl p-5 shadow-card border border-warning/30">
          <div className="flex items-center gap-2 mb-3">
            <ClipboardList className="w-5 h-5 text-warning" />
            <h3 className="font-display font-bold text-foreground">Tareas Pendientes</h3>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            {pendingPayments > 0 && (
              <a href="/pagos" className="p-4 rounded-xl bg-warning/10 border border-warning/20 flex items-center gap-3 hover:bg-warning/15 transition-colors">
                <div className="w-10 h-10 rounded-lg bg-warning/20 flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-warning" />
                </div>
                <div>
                  <p className="font-bold text-foreground">{pendingPayments} pago{pendingPayments > 1 ? "s" : ""} por validar</p>
                  <p className="text-xs text-muted-foreground">Comprobantes pendientes de revisión</p>
                </div>
              </a>
            )}
            {pendingUsers > 0 && (
              <div className="p-4 rounded-xl bg-info/10 border border-info/20 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-info/20 flex items-center justify-center">
                  <UserCheck className="w-5 h-5 text-info" />
                </div>
                <div>
                  <p className="font-bold text-foreground">{pendingUsers} padre{pendingUsers > 1 ? "s" : ""} por vincular</p>
                  <p className="text-xs text-muted-foreground">Cuentas en espera de validación</p>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )}

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
              <p className="text-lg font-medium leading-relaxed font-body">{messageOfDay}</p>
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
            <p className="text-xs text-muted-foreground font-body">{kpi.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Recent Events + Recent Notes */}
      <div className="grid md:grid-cols-2 gap-4">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          className="bg-card rounded-xl p-5 shadow-card border border-border">
          <div className="flex items-center gap-2 mb-3">
            <Calendar className="w-4 h-4 text-accent-foreground" />
            <h3 className="font-display font-bold text-foreground">Eventos Recientes</h3>
          </div>
          {eventos.length === 0 ? (
            <p className="text-sm text-muted-foreground font-body">No hay eventos aún</p>
          ) : (
            <ul className="space-y-2">
              {eventos.slice(0, 4).map(ev => (
                <li key={ev.id} className="text-sm p-3 rounded-lg bg-muted">
                  <span className="font-semibold text-foreground">{ev.titulo}</span>
                  <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {ev.fecha}</span>
                    {ev.hora && <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {ev.hora}</span>}
                    {ev.ubicacion && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {ev.ubicacion}</span>}
                  </div>
                  {ev.descripcion && <p className="text-xs text-muted-foreground mt-1">{ev.descripcion}</p>}
                </li>
              ))}
            </ul>
          )}
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}
          className="bg-card rounded-xl p-5 shadow-card border border-border">
          <div className="flex items-center gap-2 mb-3">
            <MessageSquare className="w-4 h-4 text-primary" />
            <h3 className="font-display font-bold text-foreground">Notas Recientes</h3>
          </div>
          {notas.length === 0 ? (
            <p className="text-sm text-muted-foreground font-body">No hay notas aún</p>
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

      {/* Comunicados + Agradecimientos */}
      <div className="grid md:grid-cols-2 gap-4">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
          className="bg-card rounded-xl p-5 shadow-card border border-border">
          <div className="flex items-center gap-2 mb-3">
            <FileText className="w-4 h-4 text-success" />
            <h3 className="font-display font-bold text-foreground">Últimos Comunicados</h3>
          </div>
          {comunicados.length === 0 ? (
            <p className="text-sm text-muted-foreground font-body">No hay comunicados aún</p>
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
            <p className="text-sm text-muted-foreground font-body">No hay agradecimientos aún</p>
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
                  <img src={b.foto_url} alt={b.nombre} loading="lazy" className="w-16 h-16 rounded-full mx-auto mb-2 object-cover" />
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
