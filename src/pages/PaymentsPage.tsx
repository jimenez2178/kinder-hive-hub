import { useState } from "react";
import { motion } from "framer-motion";
import { DollarSign, Plus, Trash2, Eye, Search } from "lucide-react";
import { dataStore, type Student, type Payment, generateId } from "@/lib/dataStore";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function PaymentsPage() {
  const { hasPermission } = useAuth();
  const [students, setStudents] = useState<Student[]>(dataStore.getStudents());
  const [payments, setPayments] = useState<Payment[]>(dataStore.getPayments());
  const [showAddStudent, setShowAddStudent] = useState(false);
  const [showPayment, setShowPayment] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  // Student form
  const [sName, setSName] = useState("");
  const [sGrade, setSGrade] = useState("");
  const [sFee, setSFee] = useState("");

  // Payment form
  const [pAmount, setPAmount] = useState("");
  const [pMethod, setPMethod] = useState<Payment["method"]>("efectivo");
  const [pMonth, setPMonth] = useState("");

  const canManage = hasPermission("manage-payments");
  const canViewIncome = hasPermission("view-income");

  const saveStudents = (s: Student[]) => { setStudents(s); dataStore.saveStudents(s); };
  const savePayments = (p: Payment[]) => { setPayments(p); dataStore.savePayments(p); };

  const addStudent = () => {
    if (!sName.trim()) return;
    saveStudents([...students, { id: generateId(), name: sName.trim(), grade: sGrade.trim(), monthlyFee: parseFloat(sFee) || 0 }]);
    setSName(""); setSGrade(""); setSFee(""); setShowAddStudent(false);
  };

  const addPayment = () => {
    if (!showPayment || !pAmount) return;
    const receipt = `REC-${Date.now().toString(36).toUpperCase()}`;
    savePayments([...payments, {
      id: generateId(), studentId: showPayment, amount: parseFloat(pAmount),
      method: pMethod, date: new Date().toISOString(), receiptNumber: receipt, month: pMonth,
    }]);
    setPAmount(""); setShowPayment(null);
  };

  const getStudentStatus = (studentId: string) => {
    const student = students.find(s => s.id === studentId);
    if (!student) return "unknown";
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const paid = payments.some(p => p.studentId === studentId && p.month === currentMonth);
    if (paid) return "al-dia";
    const dayOfMonth = now.getDate();
    return dayOfMonth <= 7 ? "pendiente" : "moroso";
  };

  const statusConfig = {
    "al-dia": { label: "Al día ✅", variant: "default" as const, className: "bg-success text-success-foreground" },
    "pendiente": { label: "Pendiente ⏳", variant: "secondary" as const, className: "bg-warning text-warning-foreground" },
    "moroso": { label: "Moroso ⚠️", variant: "destructive" as const, className: "bg-urgent text-urgent-foreground" },
    "unknown": { label: "—", variant: "secondary" as const, className: "" },
  };

  const totalIncome = payments.filter(p => {
    const d = new Date(p.date);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).reduce((sum, p) => sum + p.amount, 0);

  const filtered = students.filter(s => {
    if (search && !s.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterStatus !== "all" && getStudentStatus(s.id) !== filterStatus) return false;
    return true;
  });

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground flex items-center gap-2">
            <DollarSign className="w-6 h-6 text-success" /> Gestión de Pagos
          </h1>
          <p className="text-muted-foreground text-sm">Control de cuotas y pagos</p>
        </div>
        {canManage && (
          <Button onClick={() => setShowAddStudent(!showAddStudent)} className="gradient-warm text-primary-foreground border-0">
            <Plus className="w-4 h-4 mr-2" /> Agregar Estudiante
          </Button>
        )}
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {canViewIncome && (
          <div className="bg-card rounded-xl p-4 border border-border shadow-card text-center">
            <p className="text-2xl font-bold text-success">RD${totalIncome.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">Ingresos del mes</p>
          </div>
        )}
        <div className="bg-card rounded-xl p-4 border border-border shadow-card text-center">
          <p className="text-2xl font-bold text-foreground">{students.length}</p>
          <p className="text-xs text-muted-foreground">Estudiantes</p>
        </div>
        <div className="bg-card rounded-xl p-4 border border-border shadow-card text-center">
          <p className="text-2xl font-bold text-success">{students.filter(s => getStudentStatus(s.id) === "al-dia").length}</p>
          <p className="text-xs text-muted-foreground">Al día</p>
        </div>
        <div className="bg-card rounded-xl p-4 border border-border shadow-card text-center">
          <p className="text-2xl font-bold text-urgent">{students.filter(s => getStudentStatus(s.id) === "moroso").length}</p>
          <p className="text-xs text-muted-foreground">Morosos</p>
        </div>
      </div>

      {showAddStudent && canManage && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-xl p-5 border border-border shadow-card space-y-3">
          <Input placeholder="Nombre del estudiante" value={sName} onChange={e => setSName(e.target.value)} />
          <div className="flex gap-3">
            <Input placeholder="Grado (ej: 3ro)" value={sGrade} onChange={e => setSGrade(e.target.value)} />
            <Input placeholder="Cuota mensual" type="number" value={sFee} onChange={e => setSFee(e.target.value)} />
          </div>
          <Button onClick={addStudent} className="gradient-warm text-primary-foreground border-0">Registrar</Button>
        </motion.div>
      )}

      <div className="flex gap-3 flex-wrap">
        <Input placeholder="Buscar estudiante..." value={search} onChange={e => setSearch(e.target.value)} className="flex-1 min-w-48" />
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="al-dia">Al día</SelectItem>
            <SelectItem value="pendiente">Pendiente</SelectItem>
            <SelectItem value="moroso">Moroso</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-3">
        {filtered.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">No hay estudiantes registrados</p>
        ) : filtered.map(s => {
          const status = getStudentStatus(s.id);
          const cfg = statusConfig[status];
          return (
            <motion.div key={s.id} layout className="bg-card rounded-xl p-4 border border-border shadow-card flex items-center gap-4">
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-foreground">{s.name}</h3>
                <p className="text-sm text-muted-foreground">{s.grade} — RD${s.monthlyFee}/mes</p>
              </div>
              <Badge className={cfg.className}>{cfg.label}</Badge>
              {canManage && (
                <div className="flex gap-1">
                  <Button variant="outline" size="sm" onClick={() => { setShowPayment(s.id); setPAmount(String(s.monthlyFee)); setPMonth(`${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}`); }}>
                    <DollarSign className="w-3 h-3 mr-1" /> Pagar
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive"
                    onClick={() => saveStudents(students.filter(x => x.id !== s.id))}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Payment dialog */}
      <Dialog open={!!showPayment} onOpenChange={() => setShowPayment(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle className="font-display">Registrar Pago</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Input placeholder="Monto" type="number" value={pAmount} onChange={e => setPAmount(e.target.value)} />
            <Input placeholder="Mes (YYYY-MM)" value={pMonth} onChange={e => setPMonth(e.target.value)} />
            <Select value={pMethod} onValueChange={v => setPMethod(v as Payment["method"])}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="efectivo">💵 Efectivo</SelectItem>
                <SelectItem value="transferencia">🏦 Transferencia</SelectItem>
                <SelectItem value="cheque">📝 Cheque</SelectItem>
                <SelectItem value="tarjeta">💳 Tarjeta</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={addPayment} className="w-full gradient-warm text-primary-foreground border-0">Registrar Pago</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
