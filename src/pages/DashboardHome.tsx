import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Calendar, FileText, Image, Cake, Bell, MessageSquare, Sparkles, TrendingUp } from "lucide-react";
import { dataStore, type MessageOfDay } from "@/lib/dataStore";
import { useAuth } from "@/contexts/AuthContext";
import { AlertBanner } from "@/components/AlertBanner";

const WEBHOOK_URL = "https://curso-n8n-n8n.sjia2i.easypanel.host/webhook/frase-del-dia";

export default function DashboardHome() {
  const { user } = useAuth();
  const [messageOfDay, setMessageOfDay] = useState<MessageOfDay | null>(null);
  const [loadingMessage, setLoadingMessage] = useState(true);

  useEffect(() => {
    // Try to fetch today's message from the webhook
    const fetchMessage = async () => {
      try {
        const cached = dataStore.getMessageOfDay();
        const today = new Date().toISOString().split("T")[0];
        if (cached && cached.date === today) {
          setMessageOfDay(cached);
          setLoadingMessage(false);
          return;
        }

        const res = await fetch(WEBHOOK_URL);
        if (res.ok) {
          const data = await res.json();
          const msg: MessageOfDay = {
            content: data.contenido || data.message || data.frase || "¡Cada día es una nueva oportunidad para aprender! 🌟",
            type: data.tipo_mensaje || "motivacional",
            date: today,
            source: "n8n",
          };
          dataStore.saveMessageOfDay(msg);
          setMessageOfDay(msg);
        }
      } catch {
        const cached = dataStore.getMessageOfDay();
        if (cached) setMessageOfDay(cached);
        else setMessageOfDay({ content: "¡Cada día es una nueva oportunidad para aprender! 🌟", type: "motivacional", date: new Date().toISOString().split("T")[0], source: "default" });
      } finally {
        setLoadingMessage(false);
      }
    };
    fetchMessage();
  }, []);

  const alerts = dataStore.getAlerts().filter(a => a.active);
  const events = dataStore.getEvents();
  const comunicados = dataStore.getComunicados();
  const photos = dataStore.getPhotos();
  const birthdays = dataStore.getBirthdays();
  const notes = dataStore.getTeacherNotes();
  const thanks = dataStore.getThanks();

  const kpis = [
    { label: "Eventos", value: events.length, icon: Calendar, color: "bg-accent text-accent-foreground" },
    { label: "Comunicados", value: comunicados.length, icon: FileText, color: "bg-success text-success-foreground" },
    { label: "Fotos", value: photos.length, icon: Image, color: "gradient-sunset text-primary-foreground" },
    { label: "Cumpleaños", value: birthdays.length, icon: Cake, color: "bg-warning text-warning-foreground" },
    { label: "Avisos", value: alerts.length, icon: Bell, color: "bg-urgent text-urgent-foreground" },
    { label: "Notas", value: notes.length, icon: MessageSquare, color: "bg-info text-info-foreground" },
  ];

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <AlertBanner />

      {/* Welcome */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground">
          ¡Buen día, {user?.displayName}! 👋
        </h1>
        <p className="text-muted-foreground mt-1">Bienvenido/a al panel de tu centro educativo</p>
      </motion.div>

      {/* Message of the Day */}
      <motion.div
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="gradient-warm rounded-xl p-6 text-primary-foreground shadow-glow"
      >
        <div className="flex items-start gap-3">
          <Sparkles className="w-6 h-6 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="font-display font-bold text-sm uppercase tracking-wide opacity-80 mb-1">
              {messageOfDay?.type === "efemeride" ? "Efeméride del día" : "Frase del día"}
            </h3>
            {loadingMessage ? (
              <div className="h-5 w-64 bg-primary-foreground/20 rounded animate-pulse" />
            ) : (
              <p className="text-lg font-medium leading-relaxed">
                {messageOfDay?.content}
              </p>
            )}
          </div>
        </div>
      </motion.div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {kpis.map((kpi, i) => (
          <motion.div
            key={kpi.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 + i * 0.05 }}
            className="bg-card rounded-xl p-4 shadow-card border border-border text-center"
          >
            <div className={`inline-flex items-center justify-center w-10 h-10 rounded-lg ${kpi.color} mb-2`}>
              <kpi.icon className="w-5 h-5" />
            </div>
            <p className="text-2xl font-display font-bold text-foreground">{kpi.value}</p>
            <p className="text-xs text-muted-foreground">{kpi.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Quick sections */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Recent comunicados */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          className="bg-card rounded-xl p-5 shadow-card border border-border">
          <div className="flex items-center gap-2 mb-3">
            <FileText className="w-4 h-4 text-success" />
            <h3 className="font-display font-bold text-foreground">Últimos comunicados</h3>
          </div>
          {comunicados.length === 0 ? (
            <p className="text-sm text-muted-foreground">No hay comunicados aún</p>
          ) : (
            <ul className="space-y-2">
              {comunicados.slice(0, 3).map(c => (
                <li key={c.id} className="text-sm p-2 rounded-lg bg-muted">
                  <span className="font-medium text-foreground">{c.title}</span>
                  <span className="text-muted-foreground block text-xs">{c.date}</span>
                </li>
              ))}
            </ul>
          )}
        </motion.div>

        {/* Recent thanks */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
          className="bg-card rounded-xl p-5 shadow-card border border-border">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-4 h-4 text-primary" />
            <h3 className="font-display font-bold text-foreground">Agradecimientos recientes</h3>
          </div>
          {thanks.length === 0 ? (
            <p className="text-sm text-muted-foreground">No hay agradecimientos aún</p>
          ) : (
            <ul className="space-y-2">
              {thanks.slice(0, 3).map(t => (
                <li key={t.id} className="text-sm p-2 rounded-lg bg-muted">
                  <span className="text-foreground">"{t.message}"</span>
                  <span className="text-muted-foreground block text-xs">— {t.author}</span>
                </li>
              ))}
            </ul>
          )}
        </motion.div>
      </div>
    </div>
  );
}
