import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Calendar, FileText, Cake, Bell, MessageSquare, Sparkles, Clock, MapPin, Image } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AlertBanner } from "@/components/AlertBanner";
import type { Tables } from "@/integrations/supabase/types";

export default function ParentPortal() {
  const [eventos, setEventos] = useState<Tables<"eventos">[]>([]);
  const [comunicados, setComunicados] = useState<Tables<"comunicados">[]>([]);
  const [notas, setNotas] = useState<(Tables<"notas_maestras"> & { estudiante_nombre?: string })[]>([]);
  const [cumpleanos, setCumpleanos] = useState<Tables<"cumpleanos">[]>([]);
  const [fotos, setFotos] = useState<Tables<"galeria">[]>([]);
  const [messageOfDay, setMessageOfDay] = useState("¡Cada día es una nueva oportunidad para aprender! 🌟");

  useEffect(() => {
    const fetchAll = async () => {
      const [evRes, comRes, notRes, cumRes, fotRes, msgRes] = await Promise.all([
        supabase.from("eventos").select("*").order("fecha", { ascending: false }).limit(5),
        supabase.from("comunicados").select("*").order("created_at", { ascending: false }).limit(5),
        supabase.from("notas_maestras").select("*, estudiantes(nombre)").order("created_at", { ascending: false }).limit(5),
        supabase.from("cumpleanos").select("*").order("fecha"),
        supabase.from("galeria").select("*").order("created_at", { ascending: false }).limit(6),
        supabase.from("mensaje_dia").select("*").eq("fecha_iso", new Date().toISOString().split("T")[0]).limit(1).maybeSingle(),
      ]);
      if (evRes.data) setEventos(evRes.data);
      if (comRes.data) setComunicados(comRes.data);
      if (notRes.data) setNotas(notRes.data.map((n: any) => ({ ...n, estudiante_nombre: n.estudiantes?.nombre })));
      if (cumRes.data) setCumpleanos(cumRes.data);
      if (fotRes.data) setFotos(fotRes.data);
      if (msgRes.data) setMessageOfDay(msgRes.data.contenido);
    };
    fetchAll();
  }, []);

  const currentMonth = new Date().getMonth() + 1;
  const birthdaysThisMonth = cumpleanos.filter(c => new Date(c.fecha).getMonth() + 1 === currentMonth);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-6">
        <AlertBanner />

        {/* Welcome */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl p-6 bg-gradient-to-r from-amber-100 via-orange-50 to-yellow-100 dark:from-amber-900/30 dark:via-orange-900/20 dark:to-yellow-900/30 border border-amber-200 dark:border-amber-800 shadow-lg">
          <div className="flex items-center gap-4">
            <span className="text-5xl">👨‍👩‍👧‍👦</span>
            <div>
              <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground">¡Hola, Padres y Madres! 👋</h1>
              <p className="text-muted-foreground mt-1 text-lg">
                Bienvenidos al <span className="font-bold text-foreground">Pre-escolar Psicopedagógico de la Sagrada Familia</span>
              </p>
            </div>
          </div>
        </motion.div>

        {/* Message of Day */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="gradient-warm rounded-xl p-6 text-primary-foreground shadow-glow">
          <div className="flex items-start gap-3">
            <Sparkles className="w-6 h-6 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-display font-bold text-sm uppercase tracking-wide opacity-80 mb-1">Frase del día</h3>
              <p className="text-lg font-medium leading-relaxed">{messageOfDay}</p>
            </div>
          </div>
        </motion.div>

        {/* Comunicados */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="bg-card rounded-xl p-5 shadow-card border border-border">
          <div className="flex items-center gap-2 mb-3">
            <FileText className="w-5 h-5 text-success" />
            <h2 className="font-display font-bold text-foreground text-lg">Comunicados</h2>
          </div>
          {comunicados.length === 0 ? (
            <p className="text-sm text-muted-foreground">No hay comunicados</p>
          ) : (
            <div className="space-y-3">
              {comunicados.map(c => (
                <div key={c.id} className="p-3 rounded-lg bg-muted">
                  <h3 className="font-semibold text-foreground">{c.titulo}</h3>
                  <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">{c.contenido}</p>
                  <span className="text-xs text-muted-foreground mt-1 block">{c.fecha}</span>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Events + Notes */}
        <div className="grid md:grid-cols-2 gap-4">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="bg-card rounded-xl p-5 shadow-card border border-border">
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="w-5 h-5 text-accent" />
              <h2 className="font-display font-bold text-foreground">Próximos Eventos</h2>
            </div>
            {eventos.length === 0 ? <p className="text-sm text-muted-foreground">No hay eventos</p> : (
              <ul className="space-y-2">
                {eventos.map(ev => (
                  <li key={ev.id} className="p-3 rounded-lg bg-muted text-sm">
                    <span className="font-semibold text-foreground">{ev.titulo}</span>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {ev.fecha}</span>
                      {ev.hora && <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {ev.hora}</span>}
                      {ev.ubicacion && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {ev.ubicacion}</span>}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
            className="bg-card rounded-xl p-5 shadow-card border border-border">
            <div className="flex items-center gap-2 mb-3">
              <MessageSquare className="w-5 h-5 text-primary" />
              <h2 className="font-display font-bold text-foreground">Notas Recientes</h2>
            </div>
            {notas.length === 0 ? <p className="text-sm text-muted-foreground">No hay notas</p> : (
              <ul className="space-y-2">
                {notas.map(n => (
                  <li key={n.id} className="p-3 rounded-lg bg-muted text-sm">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-foreground">{n.estudiante_nombre || "Estudiante"}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-accent text-accent-foreground capitalize">{n.categoria}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{n.contenido}</p>
                  </li>
                ))}
              </ul>
            )}
          </motion.div>
        </div>

        {/* Birthdays */}
        {birthdaysThisMonth.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
            className="bg-card rounded-xl p-5 shadow-card border border-border">
            <div className="flex items-center gap-2 mb-3">
              <Cake className="w-5 h-5 text-warning" />
              <h2 className="font-display font-bold text-foreground">🎉 Cumpleañeros del Mes</h2>
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
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Gallery */}
        {fotos.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}
            className="bg-card rounded-xl p-5 shadow-card border border-border">
            <div className="flex items-center gap-2 mb-3">
              <Image className="w-5 h-5 text-info" />
              <h2 className="font-display font-bold text-foreground">Galería</h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {fotos.map(f => (
                <img key={f.id} src={f.foto_url} alt={f.titulo || "Foto"} className="rounded-lg object-cover w-full h-32 border border-border" />
              ))}
            </div>
          </motion.div>
        )}

        <footer className="text-center text-xs text-muted-foreground py-4 border-t border-border">
          <p>Pre-escolar Psicopedagógico de la Sagrada Familia © {new Date().getFullYear()}</p>
          <a href="/" className="text-primary hover:underline mt-1 block">Acceso Staff →</a>
        </footer>
      </div>
    </div>
  );
}
