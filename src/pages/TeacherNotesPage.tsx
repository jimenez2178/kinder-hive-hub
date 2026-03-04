import { useState } from "react";
import { motion } from "framer-motion";
import { GraduationCap, Plus, Trash2 } from "lucide-react";
import { dataStore, type TeacherNote, generateId } from "@/lib/dataStore";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

const CATEGORIES: { value: TeacherNote["category"]; label: string; emoji: string }[] = [
  { value: "lectura", label: "Lectura", emoji: "📖" },
  { value: "atencion", label: "Atención", emoji: "👁️" },
  { value: "conducta", label: "Conducta", emoji: "🤝" },
  { value: "escritura", label: "Escritura", emoji: "✍️" },
  { value: "motricidad", label: "Motricidad", emoji: "🏃" },
  { value: "general", label: "General", emoji: "📝" },
];

export default function TeacherNotesPage() {
  const { hasPermission, user } = useAuth();
  const [notes, setNotes] = useState<TeacherNote[]>(dataStore.getTeacherNotes());
  const [showForm, setShowForm] = useState(false);
  const [studentName, setStudentName] = useState("");
  const [category, setCategory] = useState<TeacherNote["category"]>("general");
  const [note, setNote] = useState("");
  const [filterCat, setFilterCat] = useState<string>("all");
  const [search, setSearch] = useState("");
  const canAdd = hasPermission("teacher-notes");

  const save = (updated: TeacherNote[]) => { setNotes(updated); dataStore.saveTeacherNotes(updated); };

  const handleAdd = () => {
    if (!studentName.trim() || !note.trim()) return;
    save([{
      id: generateId(), studentName: studentName.trim(), category, note: note.trim(),
      teacher: user?.displayName || "", date: new Date().toLocaleDateString("es"),
    }, ...notes]);
    setStudentName(""); setNote(""); setShowForm(false);
  };

  const filtered = notes.filter(n => {
    if (filterCat !== "all" && n.category !== filterCat) return false;
    if (search && !n.studentName.toLowerCase().includes(search.toLowerCase())) return false;
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
          <Input placeholder="Nombre del estudiante" value={studentName} onChange={e => setStudentName(e.target.value)} />
          <Select value={category} onValueChange={v => setCategory(v as TeacherNote["category"])}>
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
                  <h3 className="font-bold text-foreground">{n.studentName}</h3>
                  <Badge variant="secondary" className="text-xs">
                    {catInfo(n.category)?.emoji} {catInfo(n.category)?.label}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">{n.note}</p>
                <p className="text-xs text-muted-foreground mt-2">{n.teacher} — {n.date}</p>
              </div>
              {canAdd && (
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => save(notes.filter(x => x.id !== n.id))}>
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
