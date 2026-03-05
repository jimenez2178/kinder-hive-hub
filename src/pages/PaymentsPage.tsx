import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  DollarSign, Plus, Trash2, Edit2, Upload, FileText, Search,
  TrendingUp, Users, AlertTriangle, CheckCircle, Download, Eye, X, Printer
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import type { Tables } from "@/integrations/supabase/types";

type Estudiante = Tables<"estudiantes">;
type Pago = Tables<"pagos">;

export default function PaymentsPage() {
  const { hasPermission, user } = useAuth();
  const [estudiantes, setEstudiantes] = useState<Estudiante[]>([]);
  const [pagos, setPagos] = useState<Pago[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  // Add student
  const [showAddStudent, setShowAddStudent] = useState(false);
  const [sName, setSName] = useState("");
  const [sGrade, setSGrade] = useState("");
  const [sFee, setSFee] = useState("");
  const [sParentName, setSParentName] = useState("");
  const [sParentPhone, setSParentPhone] = useState("");

  // Payment dialog
  const [payDialog, setPayDialog] = useState<string | null>(null);
  const [pAmount, setPAmount] = useState("");
  const [pMethod, setPMethod] = useState("efectivo");
  const [pNote, setPNote] = useState("");
  const [pEstado, setPEstado] = useState("saldado");
  const [pFile, setPFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  // Edit payment
  const [editPago, setEditPago] = useState<Pago | null>(null);

  // Student detail
  const [detailStudent, setDetailStudent] = useState<string | null>(null);

  // View comprobante
  const [viewComprobante, setViewComprobante] = useState<string | null>(null);

  const canManage = hasPermission("manage-payments");
  const canViewIncome = hasPermission("view-income");
  const canEditDelete = hasPermission("edit-delete-payments");

  const fetchData = useCallback(async () => {
    const [estRes, pagRes] = await Promise.all([
      supabase.from("estudiantes").select("*").eq("activo", true).order("nombre"),
      supabase.from("pagos").select("*").order("fecha", { ascending: false }),
    ]);
    if (estRes.data) setEstudiantes(estRes.data);
    if (pagRes.data) setPagos(pagRes.data);
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Realtime subscription for pagos
  useEffect(() => {
    const channel = supabase
      .channel("payments-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "pagos" }, () => { fetchData(); })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchData]);

  const getStudentStatus = (studentId: string) => {
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const studentPagos = pagos.filter(p => p.estudiante_id === studentId);
    const paidThisMonth = studentPagos.some(p => p.fecha.startsWith(currentMonth) && p.estado === "saldado");
    if (paidThisMonth) return "al-dia";
    return now.getDate() <= 7 ? "pendiente" : "moroso";
  };

  const statusConfig: Record<string, { label: string; className: string; icon: React.ReactNode }> = {
    "al-dia": { label: "Al día", className: "bg-success/15 text-success border-success/30", icon: <CheckCircle className="w-3 h-3" /> },
    "pendiente": { label: "Pendiente", className: "bg-warning/15 text-warning border-warning/30", icon: <AlertTriangle className="w-3 h-3" /> },
    "moroso": { label: "Moroso", className: "bg-destructive/15 text-destructive border-destructive/30", icon: <AlertTriangle className="w-3 h-3" /> },
  };

  // Stats
  const totalStudents = estudiantes.length;
  const alDia = estudiantes.filter(s => getStudentStatus(s.id) === "al-dia").length;
  const morosos = estudiantes.filter(s => getStudentStatus(s.id) === "moroso").length;
  const pendientes = estudiantes.filter(s => getStudentStatus(s.id) === "pendiente").length;

  const now = new Date();
  const thisMonthPayments = pagos.filter(p => {
    const d = new Date(p.fecha);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear() && p.estado === "saldado";
  });
  const totalIncome = thisMonthPayments.reduce((s, p) => s + Number(p.monto), 0);

  const pieData = [
    { name: "Al día", value: alDia, color: "hsl(var(--success))" },
    { name: "Pendiente", value: pendientes, color: "hsl(var(--warning))" },
    { name: "Moroso", value: morosos, color: "hsl(var(--destructive))" },
  ].filter(d => d.value > 0);

  const addStudent = async () => {
    if (!sName.trim() || !sGrade.trim()) return;
    const { error } = await supabase.from("estudiantes").insert({
      nombre: sName.trim(),
      grado: sGrade.trim(),
      cuota_mensual: parseFloat(sFee) || 0,
      padre_nombre: sParentName.trim() || null,
      padre_telefono: sParentPhone.trim() || null,
    });
    if (!error) {
      setSName(""); setSGrade(""); setSFee(""); setSParentName(""); setSParentPhone("");
      setShowAddStudent(false);
      fetchData();
    }
  };

  const registerPayment = async () => {
    if (!payDialog || !pAmount) return;
    setUploading(true);
    let comprobanteUrl: string | null = null;

    if (pFile && pMethod !== "efectivo") {
      const fileName = `pago-${payDialog}-${Date.now()}.${pFile.name.split(".").pop()}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("comprobantes")
        .upload(fileName, pFile);
      if (!uploadError && uploadData) {
        const { data: urlData } = supabase.storage.from("comprobantes").getPublicUrl(uploadData.path);
        comprobanteUrl = urlData.publicUrl;
      }
    }

    const recibo = `REC-${Date.now().toString(36).toUpperCase()}`;
    await supabase.from("pagos").insert({
      estudiante_id: payDialog,
      monto: parseFloat(pAmount),
      metodo_pago: pMethod,
      estado: pEstado,
      nota: pNote.trim() || null,
      comprobante_url: comprobanteUrl,
      numero_recibo: recibo,
      created_by: user?.id || null,
    });

    setPAmount(""); setPNote(""); setPFile(null); setPMethod("efectivo"); setPEstado("saldado");
    setPayDialog(null);
    setUploading(false);
    fetchData();
  };

  const updatePayment = async () => {
    if (!editPago) return;
    await supabase.from("pagos").update({
      monto: parseFloat(pAmount),
      metodo_pago: pMethod,
      estado: pEstado,
      nota: pNote.trim() || null,
    }).eq("id", editPago.id);
    setEditPago(null); setPAmount(""); setPNote(""); setPMethod("efectivo"); setPEstado("saldado");
    fetchData();
  };

  const deletePayment = async (id: string) => {
    const { error } = await supabase.from("pagos").delete().eq("id", id);
    if (error) {
      console.error("Error deleting payment:", error);
      return;
    }
    // Refetch fresh data from DB to ensure totals are correct
    await fetchData();
  };

  const deleteStudent = async (id: string) => {
    await supabase.from("estudiantes").update({ activo: false }).eq("id", id);
    fetchData();
  };

  const getStudentPayments = (id: string) => pagos.filter(p => p.estudiante_id === id);
  const getStudentTotalPaid = (id: string) => getStudentPayments(id).filter(p => p.estado === "saldado").reduce((s, p) => s + Number(p.monto), 0);

  const printStudentReport = async (student: Estudiante) => {
    const studentPagos = getStudentPayments(student.id);
    const totalPaid = getStudentTotalPaid(student.id);
    const status = getStudentStatus(student.id);
    const { data: notasData } = await supabase
      .from("notas_maestras")
      .select("*, estudiantes(nombre)")
      .eq("estudiante_id", student.id)
      .order("created_at", { ascending: false })
      .limit(10);

    const notasHtml = (notasData || []).map((n: any) =>
      `<tr><td>${n.fecha}</td><td>${n.categoria}</td><td>${n.contenido}</td><td>${n.maestro_nombre || "—"}</td></tr>`
    ).join("");

    const pagosHtml = studentPagos.map(p =>
      `<tr><td>${p.fecha}</td><td>RD$ ${Number(p.monto).toLocaleString()}</td><td>${p.metodo_pago}</td><td>${p.estado === "saldado" ? "✅ Saldado" : "⏳ Pendiente"}</td></tr>`
    ).join("");

    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(`<!DOCTYPE html><html><head><title>Reporte - ${student.nombre}</title>
      <style>body{font-family:Nunito,sans-serif;padding:2rem;color:#333}
      h1{color:#c2410c;margin-bottom:0.25rem}h2{margin-top:1.5rem;color:#555}
      table{width:100%;border-collapse:collapse;margin-top:0.5rem}
      th,td{border:1px solid #ddd;padding:8px;text-align:left;font-size:13px}
      th{background:#f5f5f5}
      .header{display:flex;justify-content:space-between;align-items:center}
      .status{padding:4px 12px;border-radius:12px;font-weight:bold;font-size:12px}
      .al-dia{background:#dcfce7;color:#16a34a}.pendiente{background:#fef3c7;color:#d97706}
      .moroso{background:#fee2e2;color:#dc2626}
      @media print{body{padding:1rem}}</style></head><body>
      <div class="header"><div>
        <h1>Pre-escolar Psicopedagógico de la Sagrada Familia</h1>
        <p style="color:#888">Ficha del Estudiante — ${new Date().toLocaleDateString("es")}</p>
      </div></div>
      <h2>📋 Datos del Estudiante</h2>
      <table><tr><th>Nombre</th><td>${student.nombre}</td></tr>
      <tr><th>Grado</th><td>${student.grado}${student.seccion ? ` — ${student.seccion}` : ""}</td></tr>
      <tr><th>Cuota Mensual</th><td>RD$ ${Number(student.cuota_mensual).toLocaleString()}</td></tr>
      <tr><th>Padre/Madre</th><td>${student.padre_nombre || "—"}</td></tr>
      <tr><th>Teléfono</th><td>${student.padre_telefono || "—"}</td></tr>
      <tr><th>Estado</th><td><span class="status ${status}">${statusConfig[status]?.label || status}</span></td></tr>
      <tr><th>Total Pagado</th><td style="font-weight:bold;color:#16a34a">RD$ ${totalPaid.toLocaleString()}</td></tr></table>
      <h2>💰 Historial de Pagos</h2>
      ${pagosHtml ? `<table><tr><th>Fecha</th><th>Monto</th><th>Método</th><th>Estado</th></tr>${pagosHtml}</table>` : "<p>Sin pagos registrados</p>"}
      <h2>📝 Últimas Notas</h2>
      ${notasHtml ? `<table><tr><th>Fecha</th><th>Categoría</th><th>Contenido</th><th>Maestra</th></tr>${notasHtml}</table>` : "<p>Sin notas registradas</p>"}
      </body></html>`);
    win.document.close();
    win.print();
  };

  const filtered = estudiantes.filter(s => {
    if (search && !s.nombre.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterStatus !== "all" && getStudentStatus(s.id) !== filterStatus) return false;
    return true;
  });

  if (loading) return <div className="flex items-center justify-center py-20 text-muted-foreground">Cargando...</div>;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground flex items-center gap-2">
            <DollarSign className="w-7 h-7 text-success" /> Gestión de Pagos
          </h1>
          <p className="text-muted-foreground text-sm">Control financiero y cuotas</p>
        </div>
        {canManage && (
          <Button onClick={() => setShowAddStudent(!showAddStudent)} className="gradient-warm text-primary-foreground border-0">
            <Plus className="w-4 h-4 mr-2" /> Agregar Estudiante
          </Button>
        )}
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {canViewIncome && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="bg-card rounded-xl p-5 border border-border shadow-card">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-success/15 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold text-success">RD${totalIncome.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Ingresos del mes</p>
              </div>
            </div>
          </motion.div>
        )}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          className="bg-card rounded-xl p-5 border border-border shadow-card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-info/15 flex items-center justify-center">
              <Users className="w-5 h-5 text-info" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{totalStudents}</p>
              <p className="text-xs text-muted-foreground">Estudiantes</p>
            </div>
          </div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="bg-card rounded-xl p-5 border border-border shadow-card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-success/15 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-success" />
            </div>
            <div>
              <p className="text-2xl font-bold text-success">{alDia}</p>
              <p className="text-xs text-muted-foreground">Al día</p>
            </div>
          </div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="bg-card rounded-xl p-5 border border-border shadow-card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-destructive/15 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-destructive" />
            </div>
            <div>
              <p className="text-2xl font-bold text-destructive">{morosos}</p>
              <p className="text-xs text-muted-foreground">Morosos</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Chart (directora only) */}
      {canViewIncome && pieData.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="bg-card rounded-xl p-5 border border-border shadow-card">
          <h3 className="font-display font-bold text-foreground mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" /> Estadísticas de Pagos
          </h3>
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="w-48 h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} strokeWidth={2}>
                    {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2 text-sm">
              {totalStudents > 0 && (
                <>
                  <p className="text-foreground">✅ Al día: <span className="font-bold text-success">{((alDia / totalStudents) * 100).toFixed(0)}%</span></p>
                  <p className="text-foreground">⏳ Pendientes: <span className="font-bold text-warning">{((pendientes / totalStudents) * 100).toFixed(0)}%</span></p>
                  <p className="text-foreground">⚠️ Morosos: <span className="font-bold text-destructive">{((morosos / totalStudents) * 100).toFixed(0)}%</span></p>
                </>
              )}
            </div>
          </div>
        </motion.div>
      )}

      {/* Add student form */}
      {showAddStudent && canManage && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-xl p-5 border border-border shadow-card space-y-3">
          <h3 className="font-display font-bold text-foreground">Nuevo Estudiante</h3>
          <div className="grid md:grid-cols-2 gap-3">
            <Input placeholder="Nombre del estudiante" value={sName} onChange={e => setSName(e.target.value)} />
            <Input placeholder="Grado (ej: Pre-Kinder)" value={sGrade} onChange={e => setSGrade(e.target.value)} />
            <Input placeholder="Cuota mensual (RD$)" type="number" value={sFee} onChange={e => setSFee(e.target.value)} />
            <Input placeholder="Nombre del padre/madre" value={sParentName} onChange={e => setSParentName(e.target.value)} />
            <Input placeholder="Teléfono padre/madre" value={sParentPhone} onChange={e => setSParentPhone(e.target.value)} />
          </div>
          <Button onClick={addStudent} className="gradient-warm text-primary-foreground border-0">Registrar Estudiante</Button>
        </motion.div>
      )}

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Buscar estudiante..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="al-dia">✅ Al día</SelectItem>
            <SelectItem value="pendiente">⏳ Pendiente</SelectItem>
            <SelectItem value="moroso">⚠️ Moroso</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Student list */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">No hay estudiantes registrados</p>
        ) : filtered.map(s => {
          const status = getStudentStatus(s.id);
          const cfg = statusConfig[status];
          const totalPaid = getStudentTotalPaid(s.id);
          const studentPayments = getStudentPayments(s.id);
          const isExpanded = detailStudent === s.id;

          return (
            <motion.div key={s.id} layout className="bg-card rounded-xl border border-border shadow-card overflow-hidden">
              <div className="p-4 flex items-center gap-4 cursor-pointer" onClick={() => setDetailStudent(isExpanded ? null : s.id)}>
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-lg font-bold text-primary">
                  {s.nombre.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-foreground">{s.nombre}</h3>
                  <p className="text-xs text-muted-foreground">{s.grado} — Cuota: RD${Number(s.cuota_mensual).toLocaleString()}/mes — Total pagado: <span className="text-success font-semibold">RD${totalPaid.toLocaleString()}</span></p>
                </div>
                <Badge className={`${cfg.className} border text-xs flex items-center gap-1`}>
                  {cfg.icon} {cfg.label}
                </Badge>
                {canManage && (
                  <div className="flex gap-1">
                    <Button variant="outline" size="sm" onClick={(e) => {
                      e.stopPropagation();
                      setPayDialog(s.id);
                      setPAmount(String(s.cuota_mensual));
                    }}>
                      <DollarSign className="w-3 h-3 mr-1" /> Pagar
                    </Button>
                    <Button variant="outline" size="sm" onClick={(e) => {
                      e.stopPropagation();
                      printStudentReport(s);
                    }}>
                      <Printer className="w-3 h-3 mr-1" /> Reporte
                    </Button>
                    {canEditDelete && (
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive"
                        onClick={(e) => { e.stopPropagation(); deleteStudent(s.id); }}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                )}
              </div>

              {/* Expanded detail: payment history */}
              {isExpanded && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                  className="border-t border-border bg-muted/30 p-4">
                  <h4 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
                    <FileText className="w-4 h-4" /> Historial de Pagos
                  </h4>
                  {studentPayments.length === 0 ? (
                    <p className="text-xs text-muted-foreground">Sin pagos registrados</p>
                  ) : (
                    <div className="space-y-2">
                      {studentPayments.map(p => (
                        <div key={p.id} className="bg-card rounded-lg p-3 border border-border flex items-center gap-3 text-sm">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-semibold text-foreground">RD${Number(p.monto).toLocaleString()}</span>
                              <Badge variant="outline" className="text-[10px]">
                                {p.metodo_pago === "efectivo" ? "💵" : p.metodo_pago === "transferencia" ? "🏦" : p.metodo_pago === "tarjeta" ? "💳" : "📝"} {p.metodo_pago}
                              </Badge>
                              <Badge variant={p.estado === "saldado" ? "default" : "secondary"} className="text-[10px]">
                                {p.estado === "saldado" ? "✅ Saldado" : p.estado === "por_revisar" ? "⏳ En revisión" : "⏳ Pendiente"}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              📅 {p.fecha} {p.numero_recibo && `• ${p.numero_recibo}`}
                            </p>
                            {p.nota && <p className="text-xs text-muted-foreground italic mt-0.5">📝 {p.nota}</p>}
                          </div>
                          {p.comprobante_url && (
                            <Button variant="ghost" size="sm" onClick={() => setViewComprobante(p.comprobante_url)}>
                              <Eye className="w-3 h-3 mr-1" /> Ver
                            </Button>
                          )}
                          {canEditDelete && (
                            <div className="flex gap-1">
                              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => {
                                setEditPago(p);
                                setPAmount(String(p.monto));
                                setPMethod(p.metodo_pago);
                                setPEstado(p.estado);
                                setPNote(p.nota || "");
                              }}>
                                <Edit2 className="w-3 h-3" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deletePayment(p.id)}>
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Register Payment Dialog */}
      <Dialog open={!!payDialog} onOpenChange={() => setPayDialog(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle className="font-display flex items-center gap-2"><DollarSign className="w-5 h-5 text-success" /> Registrar Pago</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Monto (RD$)</Label><Input type="number" value={pAmount} onChange={e => setPAmount(e.target.value)} /></div>
            <div>
              <Label>Método de pago</Label>
              <Select value={pMethod} onValueChange={setPMethod}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="efectivo">💵 Efectivo</SelectItem>
                  <SelectItem value="transferencia">🏦 Transferencia</SelectItem>
                  <SelectItem value="tarjeta">💳 Tarjeta</SelectItem>
                  <SelectItem value="cheque">📝 Cheque</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Estado</Label>
              <Select value={pEstado} onValueChange={setPEstado}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="saldado">✅ Saldado</SelectItem>
                  <SelectItem value="pendiente">⏳ Pendiente</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {pMethod !== "efectivo" && (
              <div>
                <Label>Comprobante (imagen) *</Label>
                <Input type="file" accept="image/*" onChange={e => setPFile(e.target.files?.[0] || null)} className="mt-1" />
                {!pFile && pMethod !== "efectivo" && (
                  <p className="text-xs text-destructive mt-1">Debes adjuntar un comprobante para pagos no efectivos</p>
                )}
              </div>
            )}
            <div>
              <Label>Nota (opcional)</Label>
              <Textarea value={pNote} onChange={e => setPNote(e.target.value)} placeholder="Observación del pago..." rows={2} />
            </div>
            <Button onClick={registerPayment} disabled={uploading || (pMethod !== "efectivo" && !pFile)} className="w-full gradient-warm text-primary-foreground border-0">
              {uploading ? "Subiendo..." : "Registrar Pago"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Payment Dialog */}
      <Dialog open={!!editPago} onOpenChange={() => setEditPago(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle className="font-display flex items-center gap-2"><Edit2 className="w-5 h-5" /> Editar Pago</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Monto (RD$)</Label><Input type="number" value={pAmount} onChange={e => setPAmount(e.target.value)} /></div>
            <div>
              <Label>Método de pago</Label>
              <Select value={pMethod} onValueChange={setPMethod}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="efectivo">💵 Efectivo</SelectItem>
                  <SelectItem value="transferencia">🏦 Transferencia</SelectItem>
                  <SelectItem value="tarjeta">💳 Tarjeta</SelectItem>
                  <SelectItem value="cheque">📝 Cheque</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Estado</Label>
              <Select value={pEstado} onValueChange={setPEstado}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="saldado">✅ Saldado</SelectItem>
                  <SelectItem value="pendiente">⏳ Pendiente</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Nota (opcional)</Label>
              <Textarea value={pNote} onChange={e => setPNote(e.target.value)} rows={2} />
            </div>
            <Button onClick={updatePayment} className="w-full gradient-warm text-primary-foreground border-0">Guardar Cambios</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Comprobante Dialog */}
      <Dialog open={!!viewComprobante} onOpenChange={() => setViewComprobante(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Comprobante de Pago</DialogTitle></DialogHeader>
          {viewComprobante && (
            <div className="text-center">
              <img src={viewComprobante} alt="Comprobante" className="max-w-full rounded-lg border border-border" />
              <a href={viewComprobante} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 mt-3 text-primary text-sm hover:underline">
                <Download className="w-4 h-4" /> Descargar
              </a>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
