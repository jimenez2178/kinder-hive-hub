import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import { Calendar, FileText, Cake, MessageSquare, Sparkles, Clock, MapPin, DollarSign, LogOut, Plus, Upload, CheckCircle2, AlertCircle, Phone, UserCircle, Image as ImageIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { AlertBanner } from "@/components/AlertBanner";
import { WelcomeModal } from "@/components/WelcomeModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer";
import { useToast } from "@/hooks/use-toast";
import type { Tables } from "@/integrations/supabase/types";

export default function ParentPortal() {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const notesRef = useRef<HTMLDivElement>(null);
  const financialRef = useRef<HTMLDivElement>(null);
   const galleryRef = useRef<HTMLDivElement>(null);
   const [galeriaFotos, setGaleriaFotos] = useState<Tables<"galeria">[]>([]);

  const [estudiantes, setEstudiantes] = useState<Tables<"estudiantes">[]>([]);
  const [eventos, setEventos] = useState<Tables<"eventos">[]>([]);
  const [comunicados, setComunicados] = useState<Tables<"comunicados">[]>([]);
  const [notas, setNotas] = useState<(Tables<"notas_maestras"> & { estudiante_nombre?: string })[]>([]);
  const [pagos, setPagos] = useState<(Tables<"pagos"> & { estudiante_nombre?: string })[]>([]);
  const [cumpleanos, setCumpleanos] = useState<Tables<"cumpleanos">[]>([]);
  const [messageOfDay, setMessageOfDay] = useState("¡Cada día es una nueva oportunidad para aprender! 🌟");

  // Onboarding state
  const [showWelcome, setShowWelcome] = useState(false);
  const [profileIncomplete, setProfileIncomplete] = useState(false);

  // Payment upload state
  const [uploadDrawerOpen, setUploadDrawerOpen] = useState(false);
  const [selectedEstudiante, setSelectedEstudiante] = useState("");
  const [uploadMonto, setUploadMonto] = useState("");
  const [uploadMetodo, setUploadMetodo] = useState("transferencia");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const fetchAll = async () => {
      const [estRes, evRes, comRes, notRes, pagRes, cumRes, msgRes, galRes] = await Promise.all([
        supabase.from("estudiantes").select("*"),
        supabase.from("eventos").select("*").order("fecha", { ascending: false }).limit(5),
        supabase.from("comunicados").select("*").order("created_at", { ascending: false }).limit(5),
        supabase.from("notas_maestras").select("*, estudiantes(nombre)").order("created_at", { ascending: false }).limit(10),
        supabase.from("pagos").select("*, estudiantes(nombre)").order("fecha", { ascending: false }).limit(10),
        supabase.from("cumpleanos").select("*").order("fecha"),
        supabase.from("mensaje_dia").select("*").eq("fecha_iso", new Date().toISOString().split("T")[0]).limit(1).maybeSingle(),
        supabase.from("galeria").select("*").order("created_at", { ascending: false }).limit(8),
      ]);
      if (estRes.data) setEstudiantes(estRes.data);
      if (evRes.data) setEventos(evRes.data);
      if (comRes.data) setComunicados(comRes.data);
      if (notRes.data) setNotas(notRes.data.map((n: any) => ({ ...n, estudiante_nombre: n.estudiantes?.nombre })));
      if (pagRes.data) setPagos(pagRes.data.map((p: any) => ({ ...p, estudiante_nombre: p.estudiantes?.nombre })));
      if (cumRes.data) setCumpleanos(cumRes.data);
      if (msgRes.data) setMessageOfDay(msgRes.data.contenido);
      if (galRes.data) setGaleriaFotos(galRes.data);
    };
    fetchAll();
  }, []);

  // Check first visit & profile completion
  useEffect(() => {
    if (!user) return;
    const welcomeKey = `educonnect_welcome_${user.id}`;
    if (!localStorage.getItem(welcomeKey)) {
      setShowWelcome(true);
      localStorage.setItem(welcomeKey, "true");
    }
    // Check if phone is missing
    supabase.from("profiles").select("telefono").eq("user_id", user.id).maybeSingle().then(({ data }) => {
      if (!data?.telefono) setProfileIncomplete(true);
    });
  }, [user]);

  const handleWelcomeAction = (action: "gallery" | "notes" | "payments") => {
    setTimeout(() => {
      if (action === "gallery" && galleryRef.current) {
        galleryRef.current.scrollIntoView({ behavior: "smooth" });
      } else if (action === "notes" && notesRef.current) {
        notesRef.current.scrollIntoView({ behavior: "smooth" });
      } else if (action === "payments") {
        setUploadDrawerOpen(true);
      }
    }, 350);
  };

  const handleSavePhone = async (phone: string) => {
    if (!user || !phone.trim()) return;
    const { error } = await supabase.from("profiles").update({ telefono: phone.trim() } as any).eq("user_id", user.id);
    if (!error) {
      setProfileIncomplete(false);
      toast({ title: "✅ Teléfono guardado" });
    }
  };

  // Financial summary
  const totalPagado = pagos.filter(p => p.estado === "saldado").reduce((s, p) => s + Number(p.monto), 0);
  const cuotaTotal = estudiantes.reduce((s, e) => s + Number(e.cuota_mensual), 0);
  const saldoPendiente = Math.max(0, cuotaTotal - totalPagado);
  const ultimoPago = pagos.find(p => p.estado === "saldado");

  const currentMonth = new Date().getMonth() + 1;
  const birthdaysThisMonth = cumpleanos.filter(c => new Date(c.fecha).getMonth() + 1 === currentMonth);

  const handleUploadComprobante = async () => {
    const isCash = uploadMetodo === "efectivo";
    if (!selectedEstudiante || !uploadMonto) {
      toast({ title: "Completa todos los campos", variant: "destructive" });
      return;
    }
    if (!isCash && !uploadFile) {
      toast({ title: "Debes adjuntar el comprobante", variant: "destructive" });
      return;
    }
    setUploading(true);
    try {
      let comprobanteUrl: string | null = null;
      if (uploadFile) {
        const ext = uploadFile.name.split(".").pop();
        const path = `${user?.id}/${Date.now()}.${ext}`;
        const { error: storageError } = await supabase.storage.from("comprobantes").upload(path, uploadFile);
        if (storageError) throw storageError;
        const { data: urlData } = supabase.storage.from("comprobantes").getPublicUrl(path);
        comprobanteUrl = urlData.publicUrl;
      }
      const { error: insertError } = await supabase.from("pagos").insert({
        estudiante_id: selectedEstudiante,
        monto: parseFloat(uploadMonto),
        metodo_pago: uploadMetodo,
        comprobante_url: comprobanteUrl,
        estado: "por_revisar",
      });
      if (insertError) throw insertError;
      toast({ title: "✅ Pago registrado", description: isCash ? "Pago en efectivo registrado." : "La dirección revisará tu comprobante pronto." });
      setUploadDrawerOpen(false);
      setSelectedEstudiante(""); setUploadMonto(""); setUploadFile(null);
      const { data } = await supabase.from("pagos").select("*, estudiantes(nombre)").order("fecha", { ascending: false }).limit(10);
      if (data) setPagos(data.map((p: any) => ({ ...p, estudiante_nombre: p.estudiantes?.nombre })));
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Welcome Modal (first visit only) */}
      {showWelcome && (
        <WelcomeModal
          name={user?.displayName || ""}
          onDismiss={() => setShowWelcome(false)}
          onAction={handleWelcomeAction}
        />
      )}

      <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-6">
        <AlertBanner />

        {/* Personalized Header */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl p-6 bg-gradient-to-r from-amber-100 via-orange-50 to-yellow-100 dark:from-amber-900/30 dark:via-orange-900/20 dark:to-yellow-900/30 border border-amber-200 dark:border-amber-800 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="text-5xl">👨‍👩‍👧‍👦</span>
              <div>
                <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground">
                  ¡Hola, {user?.displayName}! 👋
                </h1>
                 <p className="text-muted-foreground mt-1 font-body">
                   Es un gusto tenerte aquí hoy — <span className="font-bold text-foreground">Pre-escolar Psicopedagógico de la Sagrada Familia</span>
                </p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={() => logout()} className="gap-2 min-h-[44px]">
              <LogOut className="w-4 h-4" /> Salir
            </Button>
          </div>
        </motion.div>

        {/* Quick Action Cards */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.03 }}
          className="grid grid-cols-3 gap-3">
          <button
            onClick={() => galleryRef.current?.scrollIntoView({ behavior: "smooth" })}
            className="bg-card rounded-xl p-4 shadow-card border border-border text-center hover:shadow-elevated transition-shadow min-h-[44px]"
          >
            <span className="text-2xl block mb-1">📸</span>
            <p className="text-xs font-semibold text-foreground">Ver Fotos</p>
          </button>
          <button
            onClick={() => notesRef.current?.scrollIntoView({ behavior: "smooth" })}
            className="bg-card rounded-xl p-4 shadow-card border border-border text-center hover:shadow-elevated transition-shadow min-h-[44px]"
          >
            <span className="text-2xl block mb-1">📝</span>
            <p className="text-xs font-semibold text-foreground">Ver Notas</p>
          </button>
          <button
            onClick={() => financialRef.current?.scrollIntoView({ behavior: "smooth" })}
            className="bg-card rounded-xl p-4 shadow-card border border-border text-center hover:shadow-elevated transition-shadow min-h-[44px]"
          >
            <span className="text-2xl block mb-1">💳</span>
            <p className="text-xs font-semibold text-foreground">Mi Cuenta</p>
          </button>
        </motion.div>

        {/* Profile completion alert */}
        {profileIncomplete && (
          <ProfileCompletionBanner onSave={handleSavePhone} />
        )}

        {/* My Students */}
        {estudiantes.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
            className="bg-card rounded-xl p-5 shadow-card border border-border">
            <h2 className="font-display font-bold text-foreground text-lg mb-3">👧 Mis Hijos</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {estudiantes.map(e => (
                <div key={e.id} className="p-3 rounded-lg bg-accent/20 border border-accent/20 flex items-center gap-3">
                  {e.foto_url ? (
                    <img src={e.foto_url} alt={e.nombre} className="w-12 h-12 rounded-full object-cover" loading="lazy" />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-xl">👦</div>
                  )}
                  <div>
                    <p className="font-semibold text-foreground">{e.nombre}</p>
                    <p className="text-xs text-muted-foreground">{e.grado}{e.seccion ? ` — ${e.seccion}` : ""}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Financial Summary */}
        <div ref={financialRef}>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}
            className="bg-card rounded-xl p-5 shadow-card border border-border">
            <div className="flex items-center gap-2 mb-4">
              <DollarSign className="w-5 h-5 text-success" />
              <h2 className="font-display font-bold text-foreground text-lg">Resumen Financiero</h2>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className={`p-4 rounded-xl border ${saldoPendiente > 0 ? "border-destructive/30 bg-destructive/5" : "border-success/30 bg-success/5"}`}>
                <p className="text-xs text-muted-foreground mb-1">Saldo Pendiente</p>
                 <p className={`text-2xl font-display font-bold ${saldoPendiente > 0 ? "text-destructive" : "text-success"}`}>
                   RD$ {saldoPendiente.toLocaleString()}
                </p>
                {saldoPendiente > 0 && (
                  <div className="flex items-center gap-1 mt-1">
                    <AlertCircle className="w-3 h-3 text-destructive" />
                    <span className="text-[10px] text-destructive">Pendiente de pago</span>
                  </div>
                )}
              </div>
              <div className="p-4 rounded-xl border border-success/30 bg-success/5">
                <p className="text-xs text-muted-foreground mb-1">Total Pagado</p>
                 <p className="text-2xl font-display font-bold text-success">
                   RD$ {totalPagado.toLocaleString()}
                </p>
                {ultimoPago && (
                  <div className="flex items-center gap-1 mt-1">
                    <CheckCircle2 className="w-3 h-3 text-success" />
                    <span className="text-[10px] text-muted-foreground">Último: {ultimoPago.fecha}</span>
                  </div>
                )}
              </div>
            </div>
            {pagos.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-foreground">Últimos Pagos</h3>
                {pagos.slice(0, 5).map(p => (
                  <div key={p.id} className="p-3 rounded-lg bg-muted flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-foreground text-sm">{p.estudiante_nombre}</p>
                      <p className="text-xs text-muted-foreground">{p.fecha} — {p.metodo_pago}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-foreground">RD$ {Number(p.monto).toLocaleString()}</p>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full inline-block ${
                        p.estado === "saldado" ? "bg-success/20 text-success" :
                        p.estado === "por_revisar" ? "bg-warning/20 text-warning" :
                        "bg-destructive/20 text-destructive"
                      }`}>{p.estado === "por_revisar" ? "En revisión" : p.estado}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </div>

        {/* Message of Day */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="gradient-warm rounded-xl p-6 text-primary-foreground shadow-glow">
          <div className="flex items-start gap-3">
            <Sparkles className="w-6 h-6 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-display font-bold text-sm uppercase tracking-wide opacity-80 mb-1">Frase del día</h3>
              <p className="text-lg font-medium leading-relaxed">{messageOfDay}</p>
            </div>
          </div>
        </motion.div>

        {/* Comunicados */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="bg-card rounded-xl p-5 shadow-card border border-border">
          <div className="flex items-center gap-2 mb-3">
            <FileText className="w-5 h-5 text-success" />
            <h2 className="font-display font-bold text-foreground text-lg">Comunicados</h2>
          </div>
          {comunicados.length === 0 ? (
            <p className="text-sm text-muted-foreground">No hay comunicados</p>
          ) : (
            <div className="space-y-3">
              {comunicados.map(c => (
                <div key={c.id} className="p-3 rounded-lg bg-muted">
                  <h3 className="font-semibold text-foreground">{c.titulo}</h3>
                  <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">{c.contenido}</p>
                  <span className="text-xs text-muted-foreground mt-1 block">{c.fecha}</span>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Events + Notes */}
        <div className="grid md:grid-cols-2 gap-4">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="bg-card rounded-xl p-5 shadow-card border border-border">
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="w-5 h-5 text-accent-foreground" />
              <h2 className="font-display font-bold text-foreground">Próximos Eventos</h2>
            </div>
            {eventos.length === 0 ? <p className="text-sm text-muted-foreground">No hay eventos</p> : (
              <ul className="space-y-2">
                {eventos.map(ev => (
                  <li key={ev.id} className="p-3 rounded-lg bg-muted text-sm">
                    <span className="font-semibold text-foreground">{ev.titulo}</span>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {ev.fecha}</span>
                      {ev.hora && <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {ev.hora}</span>}
                      {ev.ubicacion && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {ev.ubicacion}</span>}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </motion.div>

          <div ref={notesRef}>
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
              className="bg-card rounded-xl p-5 shadow-card border border-border">
              <div className="flex items-center gap-2 mb-3">
                <MessageSquare className="w-5 h-5 text-primary" />
                <h2 className="font-display font-bold text-foreground">Notas de Maestros</h2>
              </div>
              {notas.length === 0 ? <p className="text-sm text-muted-foreground">No hay notas</p> : (
                <ul className="space-y-2">
                  {notas.map(n => (
                    <li key={n.id} className="p-3 rounded-lg bg-muted text-sm">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-foreground">{n.estudiante_nombre || "Estudiante"}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-accent text-accent-foreground capitalize">{n.categoria}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{n.contenido}</p>
                    </li>
                  ))}
                </ul>
              )}
            </motion.div>
          </div>
        </div>

        {/* Gallery Section */}
        <div ref={galleryRef}>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.38 }}
            className="bg-card rounded-xl p-5 shadow-card border border-border">
            <div className="flex items-center gap-2 mb-3">
              <ImageIcon className="w-5 h-5 text-primary" />
              <h2 className="font-display font-bold text-foreground">📸 Galería de Fotos</h2>
            </div>
            {galeriaFotos.length === 0 ? (
              <p className="text-sm text-muted-foreground">No hay fotos en la galería aún</p>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {galeriaFotos.map(foto => (
                  <div key={foto.id} className="rounded-lg overflow-hidden border border-border aspect-square">
                    <img src={foto.foto_url} alt={foto.descripcion || "Foto"} loading="lazy"
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </div>

        {/* Birthdays */}
        {birthdaysThisMonth.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
            className="bg-card rounded-xl p-5 shadow-card border border-border">
            <div className="flex items-center gap-2 mb-3">
              <Cake className="w-5 h-5 text-warning" />
              <h2 className="font-display font-bold text-foreground">🎉 Cumpleañeros del Mes</h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {birthdaysThisMonth.map(b => (
                <div key={b.id} className="text-center p-3 rounded-lg bg-accent/30 border border-accent/20">
                  {b.foto_url ? (
                    <img src={b.foto_url} alt={b.nombre} className="w-16 h-16 rounded-full mx-auto mb-2 object-cover" loading="lazy" />
                  ) : (
                    <span className="text-3xl block mb-1">{b.emoji || "🎂"}</span>
                  )}
                  <p className="font-semibold text-foreground text-sm">{b.nombre}</p>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        <footer className="text-center text-xs text-muted-foreground py-4 border-t border-border">
          <p>Pre-escolar Psicopedagógico de la Sagrada Familia © {new Date().getFullYear()}</p>
        </footer>
      </div>

      {/* Floating upload button */}
      {estudiantes.length > 0 && (
        <Drawer open={uploadDrawerOpen} onOpenChange={setUploadDrawerOpen}>
          <DrawerTrigger asChild>
            <button className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full gradient-warm text-primary-foreground shadow-elevated flex items-center justify-center hover:scale-110 transition-transform active:scale-95">
              <Plus className="w-6 h-6" />
            </button>
          </DrawerTrigger>
          <DrawerContent className="max-h-[85vh]">
            <DrawerHeader>
              <DrawerTitle className="font-display">Subir Comprobante de Pago</DrawerTitle>
            </DrawerHeader>
            <div className="px-4 pb-6 space-y-4">
              <div className="space-y-2">
                <Label>Estudiante</Label>
                <Select value={selectedEstudiante} onValueChange={setSelectedEstudiante}>
                  <SelectTrigger className="min-h-[44px]"><SelectValue placeholder="Selecciona hijo/a" /></SelectTrigger>
                  <SelectContent>
                    {estudiantes.map(e => (
                      <SelectItem key={e.id} value={e.id}>{e.nombre}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Monto (L)</Label>
                <Input type="number" placeholder="0.00" value={uploadMonto} onChange={e => setUploadMonto(e.target.value)} className="min-h-[44px]" />
              </div>
              <div className="space-y-2">
                <Label>Método de pago</Label>
                <Select value={uploadMetodo} onValueChange={setUploadMetodo}>
                  <SelectTrigger className="min-h-[44px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="transferencia">🏦 Transferencia</SelectItem>
                    <SelectItem value="tarjeta">💳 Tarjeta</SelectItem>
                    <SelectItem value="efectivo">💵 Efectivo</SelectItem>
                    <SelectItem value="cheque">📄 Cheque</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {uploadMetodo !== "efectivo" && (
                <div className="space-y-2">
                  <Label>Foto del comprobante</Label>
                  <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e => setUploadFile(e.target.files?.[0] || null)} />
                  <Button variant="outline" className="w-full min-h-[44px] gap-2" onClick={() => fileRef.current?.click()}>
                    <Upload className="w-4 h-4" />
                    {uploadFile ? uploadFile.name : "Seleccionar imagen"}
                  </Button>
                </div>
              )}
              <Button
                onClick={handleUploadComprobante}
                disabled={uploading || !selectedEstudiante || !uploadMonto || (uploadMetodo !== "efectivo" && !uploadFile)}
                className="w-full gradient-warm text-primary-foreground border-0 min-h-[44px]"
              >
                {uploading ? "Enviando..." : uploadMetodo === "efectivo" ? "Registrar Pago" : "Enviar Comprobante"}
              </Button>
            </div>
          </DrawerContent>
        </Drawer>
      )}
    </div>
  );
}

/* Profile Completion Banner */
function ProfileCompletionBanner({ onSave }: { onSave: (phone: string) => void }) {
  const [phone, setPhone] = useState("");
  const [expanded, setExpanded] = useState(false);

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      className="bg-warning/10 border border-warning/30 rounded-xl p-4">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-lg bg-warning/20 flex items-center justify-center flex-shrink-0">
          <Phone className="w-4 h-4 text-warning" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-foreground">Completa tu perfil</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Agrega tu número de teléfono para que podamos contactarte en caso de emergencias.
          </p>
          {!expanded ? (
            <Button variant="outline" size="sm" className="mt-2 min-h-[36px]" onClick={() => setExpanded(true)}>
              <UserCircle className="w-4 h-4 mr-1" /> Agregar teléfono
            </Button>
          ) : (
            <div className="flex gap-2 mt-2">
              <Input
                placeholder="Ej: 9999-9999"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                className="min-h-[44px] flex-1"
              />
              <Button
                onClick={() => onSave(phone)}
                disabled={!phone.trim()}
                className="gradient-warm text-primary-foreground border-0 min-h-[44px]"
              >
                Guardar
              </Button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
