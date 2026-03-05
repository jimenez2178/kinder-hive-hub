import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { GraduationCap, Plus, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import type { Tables } from "@/integrations/supabase/types";

const CATEGORIES = [
  { value: "lectura", label: "Lectura", emoji: "📖" },
  { value: "atencion", label: "Atención", emoji: "👁️" },
  { value: "conducta", label: "Conducta", emoji: "🤝" },
  { value: "escritura", label: "Escritura", emoji: "✍️" },
  { value: "motricidad", label: "Motricidad", emoji: "🏃" },
  { value: "general", label: "General", emoji: "📝" },
];

type NotaConEstudiante = Tables<"notas_maestras"> & { estudiante_nombre?: string };

export default function TeacherNotesPage() {
  const { hasPermission, user } = useAuth();
  const { toast } = useToast();
  const [notes, setNotes] = useState<NotaConEstudiante[]>([]);
  const [students, setStudents] = useState<{ id: string; nombre: string }[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [studentId, setStudentId] = useState("");
  const [category, setCategory] = useState("general");
  const [note, setNote] = useState("");
  const [filterCat, setFilterCat] = useState("all");
  const [search, setSearch] = useState("");
  const canAdd = hasPermission("teacher-notes");

  useEffect(() => {
    fetchNotes();
    fetchStudents();
  }, []);

  const fetchNotes = async () => {
    const { data } = await supabase
      .from("notas_maestras")
      .select("*, estudiantes(nombre)")
      .order("created_at", { ascending: false });
    if (data) {
      setNotes(data.map((n: any) => ({ ...n, estudiante_nombre: n.estudiantes?.nombre })));
    }
  };

  const fetchStudents = async () => {
    const { data } = await supabase.from("estudiantes").select("id, nombre").eq("activo", true).order("nombre");
    if (data) setStudents(data);
  };

  const handleAdd = async () => {
    if (!studentId || !note.trim()) return;
    const { error } = await supabase.from("notas_maestras").insert({
      estudiante_id: studentId,
      categoria: category,
      contenido: note.trim(),
      maestro_id: user?.id || null,
      maestro_nombre: user?.displayName || null,
    });
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "✅ Nota guardada" });
    setStudentId(""); setNote(""); setShowForm(false);
    fetchNotes();
  };

  const handleDelete = async (id: string) => {
    await supabase.from("notas_maestras").delete().eq("id", id);
    toast({ title: "Nota eliminada" });
    fetchNotes();
  };

  const filtered = notes.filter(n => {
    if (filterCat !== "all" && n.categoria !== filterCat) return false;
    if (search && !(n.estudiante_nombre || "").toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const catInfo = (cat: string) => CATEGORIES.find(c => c.value === cat);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground flex items-center gap-2">
            <GraduationCap className="w-6 h-6 text-success" /> Notas de Maestros
          </h1>
          <p className="text-muted-foreground text-sm">Seguimiento del progreso estudiantil</p>
        </div>
        {canAdd && (
          <Button onClick={() => setShowForm(!showForm)} className="gradient-warm text-primary-foreground border-0">
            <Plus className="w-4 h-4 mr-2" /> Nueva Nota
          </Button>
        )}
      </div>

      <div className="flex gap-3 flex-wrap">
        <Input placeholder="Buscar por estudiante..." value={search} onChange={e => setSearch(e.target.value)} className="flex-1 min-w-48" />
        <Select value={filterCat} onValueChange={setFilterCat}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            {CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.emoji} {c.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {showForm && canAdd && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-xl p-5 border border-border shadow-card space-y-4">
          <Select value={studentId} onValueChange={setStudentId}>
            <SelectTrigger><SelectValue placeholder="Selecciona estudiante" /></SelectTrigger>
            <SelectContent>
              {students.map(s => <SelectItem key={s.id} value={s.id}>{s.nombre}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.emoji} {c.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <Textarea placeholder="Observaciones..." value={note} onChange={e => setNote(e.target.value)} rows={4} />
          <Button onClick={handleAdd} className="gradient-warm text-primary-foreground border-0">Guardar Nota</Button>
        </motion.div>
      )}

      <div className="space-y-3">
        {filtered.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">No hay notas registradas</p>
        ) : filtered.map((n, i) => (
          <motion.div key={n.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
            className="bg-card rounded-xl p-4 border border-border shadow-card">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-bold text-foreground">{n.estudiante_nombre || "Estudiante"}</h3>
                  <Badge variant="secondary" className="text-xs">
                    {catInfo(n.categoria)?.emoji} {catInfo(n.categoria)?.label}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">{n.contenido}</p>
                <p className="text-xs text-muted-foreground mt-2">{n.maestro_nombre || "Maestra"} — {n.fecha}</p>
              </div>
              {canAdd && (
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(n.id)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
