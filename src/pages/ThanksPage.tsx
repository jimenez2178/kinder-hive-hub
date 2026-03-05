import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Heart, Plus, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import type { Tables } from "@/integrations/supabase/types";

export default function ThanksPage() {
  const { hasPermission, user } = useAuth();
  const { toast } = useToast();
  const [thanks, setThanks] = useState<Tables<"agradecimientos">[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [message, setMessage] = useState("");
  const [author, setAuthor] = useState("");
  const canManage = hasPermission("manage-thanks");

  useEffect(() => { fetchThanks(); }, []);

  const fetchThanks = async () => {
    const { data } = await supabase.from("agradecimientos").select("*").order("created_at", { ascending: false });
    if (data) setThanks(data);
  };

  const handleAdd = async () => {
    if (!message.trim()) return;
    const { error } = await supabase.from("agradecimientos").insert({
      mensaje: message.trim(),
      autor: author.trim() || user?.displayName || "Anónimo",
    });
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "✅ Agradecimiento publicado" });
    setMessage(""); setAuthor(""); setShowForm(false);
    fetchThanks();
  };

  const handleDelete = async (id: string) => {
    await supabase.from("agradecimientos").delete().eq("id", id);
    toast({ title: "Agradecimiento eliminado" });
    fetchThanks();
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
              <p className="text-foreground italic mb-3">"{t.mensaje}"</p>
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">— {t.autor} • {t.fecha}</p>
                {canManage && (
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDelete(t.id)}>
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
