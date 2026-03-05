import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Bell, Plus, Trash2, ToggleLeft, ToggleRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertBanner } from "@/components/AlertBanner";
import { useToast } from "@/hooks/use-toast";
import type { Tables } from "@/integrations/supabase/types";

export default function AlertsPage() {
  const { hasPermission } = useAuth();
  const { toast } = useToast();
  const [alerts, setAlerts] = useState<Tables<"alertas">[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [priority, setPriority] = useState("info");
  const [showBanner, setShowBanner] = useState(true);
  const canManage = hasPermission("create-alerts");

  useEffect(() => { fetchAlerts(); }, []);

  const fetchAlerts = async () => {
    const { data } = await supabase.from("alertas").select("*").order("created_at", { ascending: false });
    if (data) setAlerts(data);
  };

  const handleAdd = async () => {
    if (!title.trim()) return;
    const { error } = await supabase.from("alertas").insert({
      titulo: title.trim(),
      mensaje: message.trim(),
      prioridad: priority,
      show_banner: showBanner,
      activa: true,
    });
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "✅ Aviso publicado" });
    setTitle(""); setMessage(""); setShowForm(false);
    fetchAlerts();
  };

  const toggle = async (id: string, current: boolean) => {
    await supabase.from("alertas").update({ activa: !current }).eq("id", id);
    fetchAlerts();
  };

  const remove = async (id: string) => {
    await supabase.from("alertas").delete().eq("id", id);
    toast({ title: "Aviso eliminado" });
    fetchAlerts();
  };

  const priorityLabel: Record<string, string> = { urgent: "🔴 Urgente", warning: "🟡 Advertencia", info: "🔵 Información" };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <AlertBanner />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground flex items-center gap-2">
            <Bell className="w-6 h-6 text-primary" /> Avisos Importantes
          </h1>
          <p className="text-muted-foreground text-sm">Gestiona los avisos del centro</p>
        </div>
        {canManage && (
          <Button onClick={() => setShowForm(!showForm)} className="gradient-warm text-primary-foreground border-0 min-h-[44px]">
            <Plus className="w-4 h-4 mr-2" /> Nuevo Aviso
          </Button>
        )}
      </div>

      {showForm && canManage && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-xl p-5 border border-border shadow-card space-y-4">
          <Input placeholder="Título del aviso" value={title} onChange={e => setTitle(e.target.value)} className="min-h-[44px]" />
          <Textarea placeholder="Mensaje" value={message} onChange={e => setMessage(e.target.value)} />
          <div className="flex gap-3 flex-wrap">
            <Select value={priority} onValueChange={setPriority}>
              <SelectTrigger className="w-48 min-h-[44px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="urgent">🔴 Urgente</SelectItem>
                <SelectItem value="warning">🟡 Advertencia</SelectItem>
                <SelectItem value="info">🔵 Información</SelectItem>
              </SelectContent>
            </Select>
            <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer min-h-[44px]">
              <input type="checkbox" checked={showBanner} onChange={e => setShowBanner(e.target.checked)} className="rounded" />
              Mostrar como banner
            </label>
          </div>
          <Button onClick={handleAdd} className="gradient-warm text-primary-foreground border-0 min-h-[44px]">Publicar aviso</Button>
        </motion.div>
      )}

      <div className="space-y-3">
        {alerts.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">No hay avisos registrados</p>
        ) : alerts.map(alert => (
          <motion.div key={alert.id} layout
            className={`bg-card rounded-xl p-4 border border-border shadow-card flex items-start gap-3 ${!alert.activa ? "opacity-50" : ""}
              ${alert.prioridad === "urgent" && alert.activa ? "animate-urgent-flash border-destructive/50" : ""}`}>
            <span className="text-lg">{alert.prioridad === "urgent" ? "🔴" : alert.prioridad === "warning" ? "🟡" : "🔵"}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-foreground">{alert.titulo}</h3>
                <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                  {priorityLabel[alert.prioridad] || alert.prioridad}
                </span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">{alert.mensaje}</p>
              <p className="text-xs text-muted-foreground mt-1">{new Date(alert.created_at).toLocaleDateString("es")}</p>
            </div>
            {canManage && (
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" onClick={() => toggle(alert.id, !!alert.activa)} className="min-h-[44px] min-w-[44px] text-muted-foreground">
                  {alert.activa ? <ToggleRight className="w-4 h-4 text-success" /> : <ToggleLeft className="w-4 h-4" />}
                </Button>
                <Button variant="ghost" size="icon" onClick={() => remove(alert.id)} className="min-h-[44px] min-w-[44px] text-destructive">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}
