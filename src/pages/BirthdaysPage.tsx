import { useState } from "react";
import { motion } from "framer-motion";
import { Cake, Plus, Trash2 } from "lucide-react";
import { dataStore, type Birthday, generateId } from "@/lib/dataStore";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const EMOJIS = ["🎂", "🎉", "🎈", "🎊", "🌟", "🧁", "🎁", "🥳"];

export default function BirthdaysPage() {
  const { hasPermission } = useAuth();
  const [birthdays, setBirthdays] = useState<Birthday[]>(dataStore.getBirthdays());
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [date, setDate] = useState("");
  const [emoji, setEmoji] = useState("🎂");
  const [message, setMessage] = useState("");
  const canManage = hasPermission("manage-birthdays");

  const save = (updated: Birthday[]) => { setBirthdays(updated); dataStore.saveBirthdays(updated); };

  const handleAdd = () => {
    if (!name.trim() || !date.trim()) return;
    save([...birthdays, { id: generateId(), name: name.trim(), date, emoji, message: message.trim() }]);
    setName(""); setDate(""); setMessage(""); setShowForm(false);
  };

  const currentMonth = new Date().getMonth() + 1;
  const thisMonth = birthdays.filter(b => {
    const m = parseInt(b.date.split("-")[0]);
    return m === currentMonth;
  });
  const otherMonths = birthdays.filter(b => {
    const m = parseInt(b.date.split("-")[0]);
    return m !== currentMonth;
  });

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground flex items-center gap-2">
            <Cake className="w-6 h-6 text-warning" /> Cumpleañeros
          </h1>
          <p className="text-muted-foreground text-sm">Celebremos juntos 🎉</p>
        </div>
        {canManage && (
          <Button onClick={() => setShowForm(!showForm)} className="gradient-warm text-primary-foreground border-0">
            <Plus className="w-4 h-4 mr-2" /> Agregar
          </Button>
        )}
      </div>

      {showForm && canManage && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-xl p-5 border border-border shadow-card space-y-4">
          <Input placeholder="Nombre" value={name} onChange={e => setName(e.target.value)} />
          <Input placeholder="Fecha (MM-DD, ej: 03-15)" value={date} onChange={e => setDate(e.target.value)} />
          <div>
            <p className="text-sm text-muted-foreground mb-2">Emoji:</p>
            <div className="flex gap-2">
              {EMOJIS.map(em => (
                <button key={em} onClick={() => setEmoji(em)}
                  className={`text-2xl p-1 rounded-lg ${emoji === em ? "bg-primary/20 ring-2 ring-primary" : "hover:bg-muted"}`}>
                  {em}
                </button>
              ))}
            </div>
          </div>
          <Input placeholder="Mensaje personalizado (opcional)" value={message} onChange={e => setMessage(e.target.value)} />
          <Button onClick={handleAdd} className="gradient-warm text-primary-foreground border-0">Agregar</Button>
        </motion.div>
      )}

      {thisMonth.length > 0 && (
        <div>
          <h2 className="text-lg font-display font-bold text-foreground mb-3">🎉 Este mes</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {thisMonth.map((b, i) => (
              <motion.div key={b.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }}
                className="bg-card rounded-xl p-4 border-2 border-warning/30 shadow-card text-center">
                <span className="text-4xl block mb-2">{b.emoji}</span>
                <h3 className="font-bold text-foreground">{b.name}</h3>
                <p className="text-sm text-muted-foreground">{b.date}</p>
                {b.message && <p className="text-xs text-primary mt-1">{b.message}</p>}
                {canManage && (
                  <Button variant="ghost" size="sm" className="mt-2 text-xs text-destructive"
                    onClick={() => save(birthdays.filter(x => x.id !== b.id))}>
                    <Trash2 className="w-3 h-3 mr-1" /> Eliminar
                  </Button>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {otherMonths.length > 0 && (
        <div>
          <h2 className="text-lg font-display font-bold text-foreground mb-3">📅 Otros meses</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {otherMonths.map(b => (
              <div key={b.id} className="bg-card rounded-xl p-4 border border-border shadow-card text-center">
                <span className="text-3xl block mb-2">{b.emoji}</span>
                <h3 className="font-bold text-foreground text-sm">{b.name}</h3>
                <p className="text-xs text-muted-foreground">{b.date}</p>
                {canManage && (
                  <Button variant="ghost" size="sm" className="mt-2 text-xs text-destructive"
                    onClick={() => save(birthdays.filter(x => x.id !== b.id))}>
                    <Trash2 className="w-3 h-3" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {birthdays.length === 0 && (
        <p className="text-center text-muted-foreground py-8">No hay cumpleañeros registrados</p>
      )}
    </div>
  );
}
