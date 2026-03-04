import { useState } from "react";
import { motion } from "framer-motion";
import { Calendar as CalIcon, Plus, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import { dataStore, type CalendarEvent, generateId } from "@/lib/dataStore";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

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
  const [events, setEvents] = useState<CalendarEvent[]>(dataStore.getEvents());
  const [year, setYear] = useState(2026);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const canManage = hasPermission("manage-calendar");

  const save = (updated: CalendarEvent[]) => { setEvents(updated); dataStore.saveEvents(updated); };

  const addEvent = () => {
    if (!newTitle.trim() || !selectedDate) return;
    save([...events, { id: generateId(), date: selectedDate, title: newTitle.trim() }]);
    setNewTitle("");
  };

  const removeEvent = (id: string) => save(events.filter(e => e.id !== id));

  const eventsForDate = (date: string) => events.filter(e => e.date === date);
  const eventsForMonth = (month: number) => events.filter(e => {
    const d = new Date(e.date);
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
                  const hasEvents = eventsForDate(dateStr).length > 0;
                  return (
                    <button key={day} onClick={() => setSelectedDate(dateStr)}
                      className={`h-7 w-full rounded text-xs transition-colors cursor-pointer
                        ${hasEvents ? "bg-accent text-accent-foreground font-bold" : "hover:bg-muted text-foreground"}`}>
                      {day}
                    </button>
                  );
                })}
              </div>
              {monthEvents.length > 0 && (
                <div className="mt-2 space-y-1">
                  {monthEvents.slice(0, 3).map(ev => (
                    <p key={ev.id} className="text-[10px] text-muted-foreground truncate">
                      • {ev.title}
                    </p>
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-display">
              {selectedDate && new Date(selectedDate + "T12:00:00").toLocaleDateString("es", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {selectedDate && eventsForDate(selectedDate).map(ev => (
              <div key={ev.id} className="flex items-center justify-between p-2 rounded-lg bg-muted">
                <span className="text-sm text-foreground">{ev.title}</span>
                {canManage && (
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => removeEvent(ev.id)}>
                    <Trash2 className="w-3 h-3" />
                  </Button>
                )}
              </div>
            ))}
            {selectedDate && eventsForDate(selectedDate).length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-2">Sin actividades</p>
            )}
            {canManage && (
              <div className="flex gap-2">
                <Input placeholder="Nueva actividad" value={newTitle} onChange={e => setNewTitle(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && addEvent()} />
                <Button onClick={addEvent} className="gradient-warm text-primary-foreground border-0">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
