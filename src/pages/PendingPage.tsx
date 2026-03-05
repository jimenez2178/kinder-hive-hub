import { motion } from "framer-motion";
import { Clock, LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";

export default function PendingPage() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-warning/20 mb-6">
          <Clock className="w-10 h-10 text-warning" />
        </div>
        <h1 className="text-2xl font-display font-bold text-foreground mb-2">Cuenta en espera</h1>
        <p className="text-muted-foreground mb-2">
          ¡Hola, <span className="font-semibold text-foreground">{user?.displayName}</span>!
        </p>
        <p className="text-muted-foreground mb-6">
          Tu cuenta está en espera de validación por la dirección del colegio.
          Si eres padre o tutor, asegúrate de que tu correo electrónico esté registrado
          en el perfil de tu hijo/a.
        </p>
        <div className="bg-card rounded-xl p-4 border border-border mb-6">
          <p className="text-sm text-muted-foreground">
            📧 Email registrado: <span className="font-mono text-foreground">{user?.email}</span>
          </p>
        </div>
        <Button variant="outline" onClick={() => logout()} className="gap-2">
          <LogOut className="w-4 h-4" /> Cerrar sesión
        </Button>
      </motion.div>
    </div>
  );
}
