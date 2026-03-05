import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Cake, Plus, Trash2, Upload, Image } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Tables } from "@/integrations/supabase/types";

const EMOJIS = ["🎂", "🎉", "🎈", "🎊", "🌟", "🧁", "🎁", "🥳"];

export default function BirthdaysPage() {
  const { hasPermission } = useAuth();
  const [birthdays, setBirthdays] = useState<Tables<"cumpleanos">[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [date, setDate] = useState("");
  const [emoji, setEmoji] = useState("🎂");
  const [message, setMessage] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const canManage = hasPermission("manage-birthdays");

  const fetchBirthdays = useCallback(async () => {
    const { data } = await supabase.from("cumpleanos").select("*").order("fecha");
    if (data) setBirthdays(data);
    setLoading(false);
  }, []);

  useEffect(() => { fetchBirthdays(); }, [fetchBirthdays]);

  const handleAdd = async () => {
    if (!name.trim() || !date.trim()) return;
    setUploading(true);
    let fotoUrl: string | null = null;

    if (photoFile) {
      const fileName = `cumple-${Date.now()}.${photoFile.name.split(".").pop()}`;
      const { data, error } = await supabase.storage.from("fotos").upload(fileName, photoFile);
      if (!error && data) {
        const { data: urlData } = supabase.storage.from("fotos").getPublicUrl(data.path);
        fotoUrl = urlData.publicUrl;
      }
    }

    await supabase.from("cumpleanos").insert({
      nombre: name.trim(),
      fecha: date,
      emoji,
      mensaje: message.trim() || null,
      foto_url: fotoUrl,
    });

    setName(""); setDate(""); setMessage(""); setPhotoFile(null); setShowForm(false);
    setUploading(false);
    fetchBirthdays();
  };

  const handleDelete = async (id: string) => {
    await supabase.from("cumpleanos").delete().eq("id", id);
    fetchBirthdays();
  };

  const currentMonth = new Date().getMonth() + 1;
  const thisMonth = birthdays.filter(b => new Date(b.fecha).getMonth() + 1 === currentMonth);
  const otherMonths = birthdays.filter(b => new Date(b.fecha).getMonth() + 1 !== currentMonth);

  if (loading) return <div className="flex items-center justify-center py-20 text-muted-foreground">Cargando...</div>;

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
          <div>
            <Label>Fecha de cumpleaños</Label>
            <Input type="date" value={date} onChange={e => setDate(e.target.value)} className="mt-1" />
          </div>
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
          <div>
            <Label className="flex items-center gap-2"><Image className="w-4 h-4" /> Foto (opcional)</Label>
            <Input type="file" accept="image/*" onChange={e => setPhotoFile(e.target.files?.[0] || null)} className="mt-1" />
          </div>
          <Button onClick={handleAdd} disabled={uploading} className="gradient-warm text-primary-foreground border-0">
            {uploading ? "Subiendo..." : "Agregar"}
          </Button>
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
                {b.foto_url ? (
                  <img src={b.foto_url} alt={b.nombre} className="w-20 h-20 rounded-full mx-auto mb-2 object-cover border-2 border-warning/30" />
                ) : (
                  <span className="text-4xl block mb-2">{b.emoji || "🎂"}</span>
                )}
                <h3 className="font-bold text-foreground">{b.nombre}</h3>
                <p className="text-sm text-muted-foreground">{b.fecha}</p>
                {b.mensaje && <p className="text-xs text-primary mt-1">{b.mensaje}</p>}
                {canManage && (
                  <Button variant="ghost" size="sm" className="mt-2 text-xs text-destructive" onClick={() => handleDelete(b.id)}>
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
                {b.foto_url ? (
                  <img src={b.foto_url} alt={b.nombre} className="w-16 h-16 rounded-full mx-auto mb-2 object-cover" />
                ) : (
                  <span className="text-3xl block mb-2">{b.emoji || "🎂"}</span>
                )}
                <h3 className="font-bold text-foreground text-sm">{b.nombre}</h3>
                <p className="text-xs text-muted-foreground">{b.fecha}</p>
                {canManage && (
                  <Button variant="ghost" size="sm" className="mt-2 text-xs text-destructive" onClick={() => handleDelete(b.id)}>
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
