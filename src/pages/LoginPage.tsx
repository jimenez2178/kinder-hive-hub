import { useState } from "react";
import { useAuth, type UserRole } from "@/contexts/AuthContext";
import { motion } from "framer-motion";
import { GraduationCap, LogIn, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function LoginPage() {
  const { login, signup } = useAuth();
  const [isSignup, setIsSignup] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [role, setRole] = useState<UserRole>("maestro");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (isSignup) {
      if (!displayName.trim()) { setError("Ingrese su nombre"); setLoading(false); return; }
      const result = await signup(email, password, displayName.trim(), role);
      if (result.error) setError(result.error);
    } else {
      const result = await login(email, password);
      if (result.error) setError(result.error);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl gradient-warm mb-4">
            <GraduationCap className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-display font-bold text-foreground">EduConnect</h1>
          <p className="text-muted-foreground mt-1">Pre-escolar Psicopedagógico de la Sagrada Familia</p>
        </div>

        <div className="bg-card rounded-xl shadow-elevated p-8 border border-border">
          <div className="flex gap-2 mb-6">
            <Button variant={!isSignup ? "default" : "outline"} className="flex-1" onClick={() => setIsSignup(false)}>
              <LogIn className="w-4 h-4 mr-2" /> Iniciar Sesión
            </Button>
            <Button variant={isSignup ? "default" : "outline"} className="flex-1" onClick={() => setIsSignup(true)}>
              <UserPlus className="w-4 h-4 mr-2" /> Registrarse
            </Button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignup && (
              <div className="space-y-2">
                <Label htmlFor="displayName">Nombre completo</Label>
                <Input id="displayName" value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Ej: María García" />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Correo electrónico</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="correo@ejemplo.com" autoComplete="email" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••" autoComplete={isSignup ? "new-password" : "current-password"} />
            </div>
            {isSignup && (
              <div className="space-y-2">
                <Label>Rol</Label>
                <Select value={role} onValueChange={(v) => setRole(v as UserRole)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="directora">👑 Directora</SelectItem>
                    <SelectItem value="maestro">🧑‍🏫 Maestro/a</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            {error && <p className="text-sm text-destructive font-medium">{error}</p>}
            <Button type="submit" disabled={loading} className="w-full gradient-warm text-primary-foreground border-0">
              {loading ? "Cargando..." : isSignup ? "Crear Cuenta" : "Iniciar Sesión"}
            </Button>
          </form>

          <div className="mt-6 pt-4 border-t border-border text-center">
            <p className="text-xs text-muted-foreground">
              Los padres pueden acceder sin login desde{" "}
              <a href="/padres" className="text-primary font-semibold hover:underline">/padres</a>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
