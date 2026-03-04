import { useState } from "react";
import { motion } from "framer-motion";
import { Bell, Plus, Trash2, ToggleLeft, ToggleRight } from "lucide-react";
import { dataStore, type Alert, generateId } from "@/lib/dataStore";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertBanner } from "@/components/AlertBanner";

export default function AlertsPage() {
  const { hasPermission } = useAuth();
  const [alerts, setAlerts] = useState<Alert[]>(dataStore.getAlerts());
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [priority, setPriority] = useState<Alert["priority"]>("info");
  const [showBanner, setShowBanner] = useState(true);
  const canManage = hasPermission("create-alerts");

  const save = (updated: Alert[]) => {
    setAlerts(updated);
    dataStore.saveAlerts(updated);
  };

  const handleAdd = () => {
    if (!title.trim()) return;
    const newAlert: Alert = {
      id: generateId(), title: title.trim(), message: message.trim(),
      priority, active: true, showBanner, createdAt: new Date().toISOString(),
    };
    save([newAlert, ...alerts]);
    setTitle(""); setMessage(""); setShowForm(false);
  };

  const toggle = (id: string) => save(alerts.map(a => a.id === id ? { ...a, active: !a.active } : a));
  const remove = (id: string) => save(alerts.filter(a => a.id !== id));

  const priorityLabel = { urgent: "🔴 Urgente", warning: "🟡 Advertencia", info: "🔵 Información" };

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
          <Button onClick={() => setShowForm(!showForm)} className="gradient-warm text-primary-foreground border-0">
            <Plus className="w-4 h-4 mr-2" /> Nuevo Aviso
          </Button>
        )}
      </div>

      {showForm && canManage && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-xl p-5 border border-border shadow-card space-y-4">
          <Input placeholder="Título del aviso" value={title} onChange={e => setTitle(e.target.value)} />
          <Textarea placeholder="Mensaje" value={message} onChange={e => setMessage(e.target.value)} />
          <div className="flex gap-3 flex-wrap">
            <Select value={priority} onValueChange={(v) => setPriority(v as Alert["priority"])}>
              <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="urgent">🔴 Urgente</SelectItem>
                <SelectItem value="warning">🟡 Advertencia</SelectItem>
                <SelectItem value="info">🔵 Información</SelectItem>
              </SelectContent>
            </Select>
            <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
              <input type="checkbox" checked={showBanner} onChange={e => setShowBanner(e.target.checked)} className="rounded" />
              Mostrar como banner
            </label>
          </div>
          <Button onClick={handleAdd} className="gradient-warm text-primary-foreground border-0">Publicar aviso</Button>
        </motion.div>
      )}

      <div className="space-y-3">
        {alerts.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">No hay avisos registrados</p>
        ) : alerts.map(alert => (
          <motion.div key={alert.id} layout
            className={`bg-card rounded-xl p-4 border border-border shadow-card flex items-start gap-3 ${!alert.active ? "opacity-50" : ""}`}>
            <span className="text-lg">{priority === "urgent" ? "🔴" : priority === "warning" ? "🟡" : "🔵"}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-foreground">{alert.title}</h3>
                <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                  {priorityLabel[alert.priority]}
                </span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">{alert.message}</p>
              <p className="text-xs text-muted-foreground mt-1">{new Date(alert.createdAt).toLocaleDateString("es")}</p>
            </div>
            {canManage && (
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" onClick={() => toggle(alert.id)} className="h-8 w-8 text-muted-foreground">
                  {alert.active ? <ToggleRight className="w-4 h-4 text-success" /> : <ToggleLeft className="w-4 h-4" />}
                </Button>
                <Button variant="ghost" size="icon" onClick={() => remove(alert.id)} className="h-8 w-8 text-destructive">
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
