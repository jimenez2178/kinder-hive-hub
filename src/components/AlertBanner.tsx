import { dataStore } from "@/lib/dataStore";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, Info, AlertCircle } from "lucide-react";

export function AlertBanner() {
  const alerts = dataStore.getAlerts().filter(a => a.active && a.showBanner);

  if (alerts.length === 0) return null;

  const priorityConfig = {
    urgent: { icon: AlertCircle, bg: "bg-urgent", text: "text-urgent-foreground", glow: "animate-pulse-glow" },
    warning: { icon: AlertTriangle, bg: "bg-warning", text: "text-warning-foreground", glow: "" },
    info: { icon: Info, bg: "bg-info", text: "text-info-foreground", glow: "" },
  };

  return (
    <AnimatePresence>
      <div className="space-y-2">
        {alerts.map(alert => {
          const config = priorityConfig[alert.priority];
          const Icon = config.icon;
          return (
            <motion.div
              key={alert.id}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={`${config.bg} ${config.text} ${config.glow} rounded-xl px-4 py-3 flex items-center gap-3`}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm">{alert.title}</p>
                <p className="text-sm opacity-90">{alert.message}</p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </AnimatePresence>
  );
}
