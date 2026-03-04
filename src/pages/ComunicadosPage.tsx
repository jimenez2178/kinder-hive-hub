import { useState } from "react";
import { motion } from "framer-motion";
import { FileText, Plus, Trash2, Eye } from "lucide-react";
import { dataStore, type Comunicado, generateId } from "@/lib/dataStore";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function ComunicadosPage() {
  const { hasPermission, user } = useAuth();
  const [comunicados, setComunicados] = useState<Comunicado[]>(dataStore.getComunicados());
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [viewing, setViewing] = useState<Comunicado | null>(null);
  const [search, setSearch] = useState("");
  const canPublish = hasPermission("publish-comunicados");

  const save = (updated: Comunicado[]) => { setComunicados(updated); dataStore.saveComunicados(updated); };

  const handleAdd = () => {
    if (!title.trim() || !content.trim()) return;
    save([{ id: generateId(), title: title.trim(), content: content.trim(), date: new Date().toLocaleDateString("es"), author: user?.displayName || "" }, ...comunicados]);
    setTitle(""); setContent(""); setShowForm(false);
  };

  const filtered = comunicados.filter(c =>
    c.title.toLowerCase().includes(search.toLowerCase()) || c.content.toLowerCase().includes(search.toLowerCase())
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
                <h3 className="font-bold text-foreground">{c.title}</h3>
                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{c.content}</p>
                <p className="text-xs text-muted-foreground mt-2">{c.date} — {c.author}</p>
              </div>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setViewing(c)}>
                  <Eye className="w-4 h-4 text-muted-foreground" />
                </Button>
                {canPublish && (
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => save(comunicados.filter(x => x.id !== c.id))}>
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
            <DialogTitle className="font-display">{viewing?.title}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{viewing?.content}</p>
            <p className="text-xs text-muted-foreground border-t border-border pt-3">{viewing?.date} — {viewing?.author}</p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
