import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { FileText, Plus, Trash2, Eye } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import type { Tables } from "@/integrations/supabase/types";

export default function ComunicadosPage() {
  const { hasPermission, user } = useAuth();
  const { toast } = useToast();
  const [comunicados, setComunicados] = useState<Tables<"comunicados">[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [viewing, setViewing] = useState<Tables<"comunicados"> | null>(null);
  const [search, setSearch] = useState("");
  const canPublish = hasPermission("publish-comunicados");

  useEffect(() => { fetchComunicados(); }, []);

  const fetchComunicados = async () => {
    const { data } = await supabase.from("comunicados").select("*").order("created_at", { ascending: false });
    if (data) setComunicados(data);
  };

  const handleAdd = async () => {
    if (!title.trim() || !content.trim()) return;
    const { error } = await supabase.from("comunicados").insert({
      titulo: title.trim(),
      contenido: content.trim(),
      created_by: user?.id || null,
    });
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "✅ Comunicado publicado" });
    setTitle(""); setContent(""); setShowForm(false);
    fetchComunicados();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("comunicados").delete().eq("id", id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Comunicado eliminado" });
    fetchComunicados();
  };

  const filtered = comunicados.filter(c =>
    c.titulo.toLowerCase().includes(search.toLowerCase()) || c.contenido.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground flex items-center gap-2">
            <FileText className="w-6 h-6 text-success" /> Comunicados
          </h1>
          <p className="text-muted-foreground text-sm">Comunicados institucionales</p>
        </div>
        {canPublish && (
          <Button onClick={() => setShowForm(!showForm)} className="gradient-warm text-primary-foreground border-0">
            <Plus className="w-4 h-4 mr-2" /> Nuevo
          </Button>
        )}
      </div>

      <Input placeholder="Buscar comunicados..." value={search} onChange={e => setSearch(e.target.value)} />

      {showForm && canPublish && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-xl p-5 border border-border shadow-card space-y-4">
          <Input placeholder="Título" value={title} onChange={e => setTitle(e.target.value)} />
          <Textarea placeholder="Contenido del comunicado..." value={content} onChange={e => setContent(e.target.value)} rows={6} />
          <Button onClick={handleAdd} className="gradient-warm text-primary-foreground border-0">Publicar</Button>
        </motion.div>
      )}

      <div className="space-y-3">
        {filtered.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">No hay comunicados</p>
        ) : filtered.map((c, i) => (
          <motion.div key={c.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className="bg-card rounded-xl p-4 border border-border shadow-card">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-foreground">{c.titulo}</h3>
                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{c.contenido}</p>
                <p className="text-xs text-muted-foreground mt-2">{c.fecha}</p>
              </div>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setViewing(c)}>
                  <Eye className="w-4 h-4 text-muted-foreground" />
                </Button>
                {canPublish && (
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(c.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <Dialog open={!!viewing} onOpenChange={() => setViewing(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="font-display">{viewing?.titulo}</DialogTitle>
            <DialogDescription>Comunicado institucional</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{viewing?.contenido}</p>
            <p className="text-xs text-muted-foreground border-t border-border pt-3">{viewing?.fecha}</p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
