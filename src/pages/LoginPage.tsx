import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";
import { GraduationCap, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!login(username, password)) {
      setError("Credenciales incorrectas");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl gradient-warm mb-4">
            <GraduationCap className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-display font-bold text-foreground">EduConnect</h1>
          <p className="text-muted-foreground mt-1">Centro Educativo Dashboard</p>
        </div>

        <div className="bg-card rounded-xl shadow-elevated p-8 border border-border">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Usuario</Label>
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Ej: directora"
                autoComplete="username"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••"
                autoComplete="current-password"
              />
            </div>
            {error && (
              <p className="text-sm text-destructive font-medium">{error}</p>
            )}
            <Button type="submit" className="w-full gradient-warm text-primary-foreground border-0">
              <LogIn className="w-4 h-4 mr-2" />
              Iniciar Sesión
            </Button>
          </form>

          <div className="mt-6 pt-4 border-t border-border">
            <p className="text-xs text-muted-foreground text-center mb-3">Credenciales de prueba:</p>
            <div className="grid grid-cols-3 gap-2 text-xs text-center">
              {[
                { user: "directora", icon: "👑" },
                { user: "asistente", icon: "⭐" },
                { user: "maestro", icon: "🧑‍🏫" },
              ].map((c) => (
                <button
                  key={c.user}
                  type="button"
                  onClick={() => { setUsername(c.user); setPassword("1234"); }}
                  className="p-2 rounded-lg bg-muted hover:bg-muted/80 transition-colors cursor-pointer"
                >
                  <span className="block text-lg">{c.icon}</span>
                  <span className="text-muted-foreground capitalize">{c.user}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
