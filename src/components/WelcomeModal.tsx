import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Camera, MessageSquare, CreditCard, X, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";

interface WelcomeModalProps {
  name: string;
  onDismiss: () => void;
  onAction: (action: "gallery" | "notes" | "payments") => void;
  variant?: "parent" | "staff";
}

export function WelcomeModal({ name, onDismiss, onAction, variant = "parent" }: WelcomeModalProps) {
  const [visible, setVisible] = useState(true);

  const handleDismiss = () => {
    setVisible(false);
    setTimeout(onDismiss, 300);
  };

  const isStaff = variant === "staff";

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/40 backdrop-blur-sm"
          onClick={handleDismiss}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="bg-card rounded-2xl shadow-elevated border border-border w-full max-w-md overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header gradient */}
            <div className="gradient-warm p-6 text-primary-foreground relative">
              <button
                onClick={handleDismiss}
                className="absolute top-3 right-3 w-8 h-8 rounded-full bg-primary-foreground/20 flex items-center justify-center hover:bg-primary-foreground/30 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="flex items-center gap-3 mb-3">
                {isStaff ? <GraduationCap className="w-8 h-8" /> : <Sparkles className="w-8 h-8" />}
                <span className="text-4xl">🌟</span>
              </div>
              <h2 className="text-xl font-display font-bold">
                ¡Bienvenido(a), {name}!
              </h2>
            </div>

            {/* Content */}
            <div className="p-6 space-y-5">
              <p className="text-sm text-muted-foreground leading-relaxed">
                {isStaff
                  ? <>¡Es un gusto tenerte en la familia del <span className="font-bold text-foreground">Pre-escolar Sagrada Familia</span>! 🌟 Desde aquí podrás gestionar eventos, notas, comunicados y toda la información del centro educativo.</>
                  : <>¡Bienvenido(a) a la familia del <span className="font-bold text-foreground">Pre-escolar Sagrada Familia</span>! 🌟 Aquí podrás seguir de cerca el crecimiento de tu hijo(a), ver sus fotos, estar al tanto de los comunicados urgentes y gestionar tus pagos de forma sencilla.</>
                }
              </p>

              {!isStaff && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Acciones rápidas</p>
                  <div className="grid gap-2">
                    <Button
                      variant="outline"
                      className="w-full justify-start gap-3 min-h-[48px] text-left"
                      onClick={() => { handleDismiss(); onAction("gallery"); }}
                    >
                      <span className="w-9 h-9 rounded-lg bg-warning/15 flex items-center justify-center flex-shrink-0">
                        <Camera className="w-4 h-4 text-warning" />
                      </span>
                      <div>
                        <p className="font-semibold text-foreground text-sm">📸 Ver fotos de hoy</p>
                        <p className="text-[11px] text-muted-foreground">Galería y cumpleaños</p>
                      </div>
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full justify-start gap-3 min-h-[48px] text-left"
                      onClick={() => { handleDismiss(); onAction("notes"); }}
                    >
                      <span className="w-9 h-9 rounded-lg bg-primary/15 flex items-center justify-center flex-shrink-0">
                        <MessageSquare className="w-4 h-4 text-primary" />
                      </span>
                      <div>
                        <p className="font-semibold text-foreground text-sm">📝 Ver notas de la maestra</p>
                        <p className="text-[11px] text-muted-foreground">Observaciones y reportes</p>
                      </div>
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full justify-start gap-3 min-h-[48px] text-left"
                      onClick={() => { handleDismiss(); onAction("payments"); }}
                    >
                      <span className="w-9 h-9 rounded-lg bg-success/15 flex items-center justify-center flex-shrink-0">
                        <CreditCard className="w-4 h-4 text-success" />
                      </span>
                      <div>
                        <p className="font-semibold text-foreground text-sm">💳 Mi Estado de Cuenta</p>
                        <p className="text-[11px] text-muted-foreground">Pagos y comprobantes</p>
                      </div>
                    </Button>
                  </div>
                </div>
              )}

              <Button
                onClick={handleDismiss}
                className="w-full gradient-warm text-primary-foreground border-0 min-h-[44px]"
              >
                ¡Entendido, vamos! 🚀
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
