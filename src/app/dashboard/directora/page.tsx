export const dynamic = "force-dynamic";

import { createClient } from "@/utils/supabase/server";
import { DirectorDashboardClient } from "./components/DirectorDashboardClient";
import { redirect } from "next/navigation";

export default async function DirectoraPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect("/login");
    }

    // 1. Catálogo de Estudiantes
    const { data: estudiantes } = await supabase.from("estudiantes").select("*");

    // 1b. Catálogo de Padres (para vinculación en el registro de estudiantes)
    const { data: padres } = await supabase
        .from("perfiles")
        .select("id, nombre, nombre_completo")
        .eq("rol", "padre");

    // 1c. Catálogo de Cuentas Pendientes (Nuevos Padres)
    const { data: usuariosPendientes } = await supabase
        .from("perfiles")
        .select("id, nombre, nombre_completo, created_at")
        .eq("rol", "padre")
        .eq("estado", "pendiente");

    // 1d. Pagos para revisión de comprobantes
    const { data: pagosRevision } = await supabase
        .from("pagos")
        .select("*, estudiantes(nombre)")
        .or("estado.eq.en_revision,estado.eq.pendiente")
        .order("fecha", { ascending: false });

    // 2. Cálculos Financieros del Mes Actual y Tendencia 3 Meses
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    const getMonthRange = (monthOffset: number) => {
        const d = new Date(now.getFullYear(), now.getMonth() - monthOffset, 1);
        const y = d.getFullYear();
        const m = d.getMonth() + 1;
        const lastDay = new Date(y, m, 0).getDate();
        return {
            start: `${y}-${String(m).padStart(2, '0')}-01`,
            end: `${y}-${String(m).padStart(2, '0')}-${lastDay}`,
            name: d.toLocaleString('es-ES', { month: 'long' })
        };
    };

    const month0 = getMonthRange(0);
    const month1 = getMonthRange(1);
    const month2 = getMonthRange(2);

    // Fetch all payments for the 3-month range at once to be even more efficient
    const { data: allRecentPagos } = await supabase
        .from("pagos")
        .select("monto, fecha, estado, estudiante_id")
        .gte("fecha", month2.start)
        .lte("fecha", month0.end);

    const filterPagosByRange = (pagosArr: any[], start: string, end: string) => {
        return pagosArr?.filter(p => p.fecha >= start && p.fecha <= end && p.estado === "saldado") || [];
    };

    const pagosM0 = filterPagosByRange(allRecentPagos || [], month0.start, month0.end);
    const pagosM1 = filterPagosByRange(allRecentPagos || [], month1.start, month1.end);
    const pagosM2 = filterPagosByRange(allRecentPagos || [], month2.start, month2.end);

    const ingresosDelMes = pagosM0.reduce((acc, p) => acc + (p.monto || 0), 0);
    const ingresosMes1 = pagosM1.reduce((acc, p) => acc + (p.monto || 0), 0);
    const ingresosMes2 = pagosM2.reduce((acc, p) => acc + (p.monto || 0), 0);

    const trendData = [
        { month: month2.name, total: ingresosMes2 },
        { month: month1.name, total: ingresosMes1 },
        { month: month0.name, total: ingresosDelMes }
    ];

    // Cálculos de pendientes y efectividad (en memoria)
    let countPendientes = 0;
    let metaTotal = 0;
    let sumaEficiencia = 0;

    if (estudiantes) {
        estudiantes.forEach(est => {
            const cuota = est.cuota_mensual || 11000;
            metaTotal += cuota;

            // Pagos de este estudiante en el mes 0
            const pagosEstM0 = pagosM0.filter(p => p.estudiante_id === est.id);
            const totalPagado = pagosEstM0.reduce((acc, p) => acc + (p.monto || 0), 0);

            if (totalPagado < cuota) {
                countPendientes++;
            }
            sumaEficiencia += Math.min(1, totalPagado / cuota);
        });
    }

    const porcentajeCobro = (estudiantes?.length || 0) > 0 ? Math.round((sumaEficiencia / (estudiantes?.length || 0)) * 100) : 0;

    // 3. Datos para la Previsualización y Métricas Directas
    const { data: allComunicados } = await supabase.from("comunicados").select("*").order("created_at", { ascending: false });
    const { data: galeria } = await supabase.from("galeria").select("*").order("created_at", { ascending: false });
    const { data: eventos } = await supabase.from("eventos").select("*").order("fecha", { ascending: true }).limit(3);
    const { data: agradecimientos } = await supabase.from("agradecimientos").select("*").order("created_at", { ascending: false }).limit(2);


    return (
        <div className="min-h-screen bg-slate-50 pb-12">
            <DirectorDashboardClient
                estudiantes={estudiantes || []}
                padres={padres || []}
                usuariosPendientes={usuariosPendientes || []}
                pagosRevision={pagosRevision || []}
                metrics={{
                    ingresosDelMes,
                    metaTotal,
                    pendientes: countPendientes,
                    porcentajeCobro,
                    totalEstudiantes: estudiantes?.length || 0,
                    alDia: (estudiantes?.length || 0) - countPendientes,
                    comunicadosCount: allComunicados?.length || 0,
                    trendData
                }}
                previewData={{
                    comunicado: allComunicados?.[0],
                    galeria: galeria || [],
                    eventos: eventos || [],
                    agradecimientos: agradecimientos || []
                }}
            />
        </div>
    );
}
