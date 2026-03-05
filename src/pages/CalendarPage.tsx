import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Calendar as CalIcon, Plus, Trash2, ChevronLeft, ChevronRight, Clock, MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import type { Tables } from "@/integrations/supabase/types";

const MONTHS = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
const DAYS = ["Lu","Ma","Mi","Ju","Vi","Sa","Do"];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}
function getFirstDayOfMonth(year: number, month: number) {
  const d = new Date(year, month, 1).getDay();
  return d === 0 ? 6 : d - 1;
}

export default function CalendarPage() {
  const { hasPermission } = useAuth();
  const { toast } = useToast();
  const [events, setEvents] = useState<Tables<"eventos">[]>([]);
  const [year, setYear] = useState(new Date().getFullYear());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newHora, setNewHora] = useState("");
  const [newUbicacion, setNewUbicacion] = useState("");
  const canManage = hasPermission("manage-calendar");

  useEffect(() => { fetchEvents(); }, []);

  const fetchEvents = async () => {
    const { data } = await supabase.from("eventos").select("*").order("fecha", { ascending: true });
    if (data) setEvents(data);
  };

  const addEvent = async () => {
    if (!newTitle.trim() || !selectedDate) return;
    const { error } = await supabase.from("eventos").insert({
      titulo: newTitle.trim(),
      descripcion: newDesc.trim() || null,
      fecha: selectedDate,
      hora: newHora || null,
      ubicacion: newUbicacion.trim() || null,
    });
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "✅ Evento agregado" });
    setNewTitle(""); setNewDesc(""); setNewHora(""); setNewUbicacion("");
    fetchEvents();
  };

  const removeEvent = async (id: string) => {
    await supabase.from("eventos").delete().eq("id", id);
    toast({ title: "Evento eliminado" });
    fetchEvents();
  };

  const eventsForDate = (date: string) => events.filter(e => e.fecha === date);
  const eventsForMonth = (month: number) => events.filter(e => {
    const d = new Date(e.fecha);
    return d.getFullYear() === year && d.getMonth() === month;
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground flex items-center gap-2">
            <CalIcon className="w-6 h-6 text-accent" /> Calendario {year}
          </h1>
          <p className="text-muted-foreground text-sm">Calendario anual interactivo</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => setYear(y => y - 1)}><ChevronLeft className="w-4 h-4" /></Button>
          <span className="font-bold text-foreground w-14 text-center">{year}</span>
          <Button variant="outline" size="icon" onClick={() => setYear(y => y + 1)}><ChevronRight className="w-4 h-4" /></Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {MONTHS.map((monthName, monthIdx) => {
          const days = getDaysInMonth(year, monthIdx);
          const firstDay = getFirstDayOfMonth(year, monthIdx);
          const monthEvents = eventsForMonth(monthIdx);

          return (
            <motion.div key={monthIdx} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: monthIdx * 0.03 }}
              className="bg-card rounded-xl p-4 border border-border shadow-card">
              <h3 className="font-display font-bold text-foreground mb-2 text-center">{monthName}</h3>
              <div className="grid grid-cols-7 gap-0.5 text-center text-[10px] mb-1">
                {DAYS.map(d => <span key={d} className="text-muted-foreground font-medium">{d}</span>)}
              </div>
              <div className="grid grid-cols-7 gap-0.5">
                {Array.from({ length: firstDay }).map((_, i) => <div key={`e-${i}`} />)}
                {Array.from({ length: days }).map((_, i) => {
                  const day = i + 1;
                  const dateStr = `${year}-${String(monthIdx + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                  const dayEvents = eventsForDate(dateStr);
                  const hasEvents = dayEvents.length > 0;
                  return (
                    <button key={day} onClick={() => setSelectedDate(dateStr)}
                      title={hasEvents ? dayEvents.map(e => e.titulo).join(", ") : ""}
                      className={`h-7 w-full rounded text-xs transition-colors cursor-pointer relative
                        ${hasEvents ? "bg-calendar-event text-calendar-event-foreground font-bold shadow-sm" : "hover:bg-muted text-foreground"}`}>
                      {day}
                      {hasEvents && <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-calendar-event-dot rounded-full" />}
                    </button>
                  );
                })}
              </div>
              {monthEvents.length > 0 && (
                <div className="mt-2 space-y-1">
                  {monthEvents.slice(0, 3).map(ev => (
                    <div key={ev.id} className="text-[10px] text-muted-foreground truncate flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-calendar-event flex-shrink-0" />
                      <span className="truncate">{ev.titulo}</span>
                      {ev.hora && <span className="text-calendar-event flex-shrink-0">{ev.hora.slice(0, 5)}</span>}
                    </div>
                  ))}
                  {monthEvents.length > 3 && <p className="text-[10px] text-accent">+{monthEvents.length - 3} más</p>}
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Day detail dialog */}
      <Dialog open={!!selectedDate} onOpenChange={() => setSelectedDate(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display">
              {selectedDate && new Date(selectedDate + "T12:00:00").toLocaleDateString("es", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 max-h-[60vh] overflow-y-auto">
            {selectedDate && eventsForDate(selectedDate).map(ev => (
              <div key={ev.id} className="p-3 rounded-lg bg-muted space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-sm text-foreground">{ev.titulo}</span>
                  {canManage && (
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => removeEvent(ev.id)}>
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  )}
                </div>
                {ev.descripcion && <p className="text-xs text-muted-foreground">{ev.descripcion}</p>}
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  {ev.hora && <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {ev.hora.slice(0, 5)}</span>}
                  {ev.ubicacion && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {ev.ubicacion}</span>}
                </div>
              </div>
            ))}
            {selectedDate && eventsForDate(selectedDate).length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-2">Sin actividades</p>
            )}
            {canManage && (
              <div className="space-y-3 pt-2 border-t border-border">
                <h4 className="font-display font-bold text-sm text-foreground">Agregar Evento</h4>
                <div className="space-y-2">
                  <div>
                    <Label className="text-xs">Título de la actividad *</Label>
                    <Input placeholder="Ej: Reunión de padres" value={newTitle} onChange={e => setNewTitle(e.target.value)} />
                  </div>
                  <div>
                    <Label className="text-xs">Descripción</Label>
                    <Textarea placeholder="Descripción del evento..." value={newDesc} onChange={e => setNewDesc(e.target.value)} rows={2} />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-xs">Hora</Label>
                      <Input type="time" value={newHora} onChange={e => setNewHora(e.target.value)} />
                    </div>
                    <div>
                      <Label className="text-xs">Ubicación</Label>
                      <Input placeholder="Ej: Salón A" value={newUbicacion} onChange={e => setNewUbicacion(e.target.value)} />
                    </div>
                  </div>
                </div>
                <Button onClick={addEvent} className="w-full gradient-warm text-primary-foreground border-0">
                  <Plus className="w-4 h-4 mr-2" /> Agregar Evento
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
