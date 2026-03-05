import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, Info, AlertCircle } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

export function AlertBanner() {
  const [alerts, setAlerts] = useState<Tables<"alertas">[]>([]);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from("alertas")
        .select("*")
        .eq("activa", true)
        .eq("show_banner", true)
        .order("created_at", { ascending: false });
      if (data) setAlerts(data);
    };
    fetch();
  }, []);

  if (alerts.length === 0) return null;

  const priorityConfig: Record<string, { icon: typeof AlertCircle; bgClass: string; glowClass: string }> = {
    urgente: { icon: AlertCircle, bgClass: "bg-red-600 text-white font-bold", glowClass: "animate-urgent-flash" },
    advertencia: { icon: AlertTriangle, bgClass: "bg-warning text-warning-foreground", glowClass: "" },
    info: { icon: Info, bgClass: "bg-info text-info-foreground", glowClass: "" },
  };

  return (
    <AnimatePresence>
      <div className="space-y-2">
        {alerts.map(alert => {
          const config = priorityConfig[alert.prioridad] || priorityConfig.info;
          const Icon = config.icon;
          return (
            <motion.div
              key={alert.id}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={`${config.bgClass} ${config.glowClass} rounded-xl px-4 py-3 flex items-center gap-3 min-h-[44px]`}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm">{alert.titulo}</p>
                <p className="text-sm opacity-90">{alert.mensaje}</p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </AnimatePresence>
  );
}
