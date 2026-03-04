import { useState } from "react";
import { motion } from "framer-motion";
import { Heart, Plus, Trash2 } from "lucide-react";
import { dataStore, type ThankYou, generateId } from "@/lib/dataStore";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export default function ThanksPage() {
  const { hasPermission, user } = useAuth();
  const [thanks, setThanks] = useState<ThankYou[]>(dataStore.getThanks());
  const [showForm, setShowForm] = useState(false);
  const [message, setMessage] = useState("");
  const [author, setAuthor] = useState("");
  const canManage = hasPermission("manage-thanks");

  const save = (updated: ThankYou[]) => { setThanks(updated); dataStore.saveThanks(updated); };

  const handleAdd = () => {
    if (!message.trim()) return;
    save([{ id: generateId(), message: message.trim(), author: author.trim() || user?.displayName || "Anónimo", date: new Date().toLocaleDateString("es") }, ...thanks]);
    setMessage(""); setAuthor(""); setShowForm(false);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground flex items-center gap-2">
            <Heart className="w-6 h-6 text-primary" /> Muro de Agradecimientos
          </h1>
          <p className="text-muted-foreground text-sm">Mensajes de la comunidad 💛</p>
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
          <Textarea placeholder="Escribe un mensaje de agradecimiento..." value={message} onChange={e => setMessage(e.target.value)} rows={3} />
          <Input placeholder="Autor (opcional)" value={author} onChange={e => setAuthor(e.target.value)} />
          <Button onClick={handleAdd} className="gradient-warm text-primary-foreground border-0">Publicar 💛</Button>
        </motion.div>
      )}

      {thanks.length === 0 ? (
        <p className="text-center text-muted-foreground py-8">No hay agradecimientos aún</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {thanks.map((t, i) => (
            <motion.div key={t.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-card rounded-xl p-5 border border-border shadow-card relative">
              <span className="absolute top-3 right-3 text-2xl opacity-20">💛</span>
              <p className="text-foreground italic mb-3">"{t.message}"</p>
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">— {t.author} • {t.date}</p>
                {canManage && (
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive"
                    onClick={() => save(thanks.filter(x => x.id !== t.id))}>
                    <Trash2 className="w-3 h-3" />
                  </Button>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
