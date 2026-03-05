import { useState } from "react";
import { motion } from "framer-motion";
import { Image as ImageIcon, Plus, Trash2, X, Edit2 } from "lucide-react";
import { dataStore, type Photo, generateId } from "@/lib/dataStore";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function GalleryPage() {
  const { hasPermission } = useAuth();
  const [photos, setPhotos] = useState<Photo[]>(dataStore.getPhotos());
  const [showUpload, setShowUpload] = useState(false);
  const [url, setUrl] = useState("");
  const [desc, setDesc] = useState("");
  const [viewing, setViewing] = useState<Photo | null>(null);
  const canUpload = hasPermission("upload-photos");

  const save = (updated: Photo[]) => { setPhotos(updated); dataStore.savePhotos(updated); };

  const handleAdd = () => {
    if (!url.trim()) return;
    save([{ id: generateId(), url: url.trim(), description: desc.trim(), date: new Date().toLocaleDateString("es") }, ...photos]);
    setUrl(""); setDesc(""); setShowUpload(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => setUrl(ev.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground flex items-center gap-2">
            <ImageIcon className="w-6 h-6 text-primary" /> Galería de Fotos
          </h1>
          <p className="text-muted-foreground text-sm">Momentos especiales del centro</p>
        </div>
        {canUpload && (
          <Button onClick={() => setShowUpload(!showUpload)} className="gradient-warm text-primary-foreground border-0">
            <Plus className="w-4 h-4 mr-2" /> Subir Foto
          </Button>
        )}
      </div>

      {showUpload && canUpload && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-xl p-5 border border-border shadow-card space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Imagen</label>
            <input type="file" accept="image/*" onChange={handleFileUpload} className="text-sm text-muted-foreground" />
            {!url && <Input placeholder="O pega una URL de imagen" value={url} onChange={e => setUrl(e.target.value)} />}
          </div>
          {url && (
            <div className="relative w-32 h-32 rounded-lg overflow-hidden bg-muted">
              <img src={url} alt="preview" className="w-full h-full object-cover" />
              <button onClick={() => setUrl("")} className="absolute top-1 right-1 bg-foreground/60 text-background rounded-full p-0.5">
                <X className="w-3 h-3" />
              </button>
            </div>
          )}
          <Textarea placeholder="Descripción de la foto/actividad..." value={desc} onChange={e => setDesc(e.target.value)} rows={3} />
          <Button onClick={handleAdd} className="gradient-warm text-primary-foreground border-0">Subir</Button>
        </motion.div>
      )}

      {photos.length === 0 ? (
        <p className="text-center text-muted-foreground py-8">No hay fotos en la galería</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {photos.map((photo, i) => (
            <motion.div key={photo.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
              className="bg-card rounded-xl overflow-hidden border border-border shadow-card group cursor-pointer"
              onClick={() => setViewing(photo)}>
              <div className="aspect-video bg-muted relative overflow-hidden">
                <img src={photo.url} alt={photo.description} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
              </div>
              <div className="p-3">
                <p className="text-sm text-foreground line-clamp-2">{photo.description || "Sin descripción"}</p>
                <p className="text-xs text-muted-foreground mt-1">{photo.date}</p>
              </div>
              {canUpload && (
                <div className="px-3 pb-3 flex gap-1">
                  <Button variant="ghost" size="sm" className="h-7 text-xs text-destructive"
                    onClick={(e) => { e.stopPropagation(); save(photos.filter(p => p.id !== photo.id)); }}>
                    <Trash2 className="w-3 h-3 mr-1" /> Eliminar
                  </Button>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}

      <Dialog open={!!viewing} onOpenChange={() => setViewing(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader><DialogTitle className="font-display">{viewing?.description || "Foto"}</DialogTitle></DialogHeader>
          {viewing && (
            <div className="space-y-3">
              <img src={viewing.url} alt={viewing.description} className="w-full rounded-lg" />
              <p className="text-sm text-muted-foreground">{viewing.description}</p>
              <p className="text-xs text-muted-foreground">{viewing.date}</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
