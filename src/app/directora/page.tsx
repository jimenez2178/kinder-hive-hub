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

    // 2. Cálculos Financieros del Mes Actual y Tendencia 3 Meses
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    const getMonthRange = (monthOffset: number) => {
        const d = new Date(now.getFullYear(), now.getMonth() - monthOffset, 1);
        const y = d.getFullYear();
        const m = d.getMonth() + 1;
        return {
            start: `${y}-${String(m).padStart(2, '0')}-01`,
            end: `${y}-${String(m).padStart(2, '0')}-31`,
            name: d.toLocaleString('es-ES', { month: 'long' })
        };
    };

    const month0 = getMonthRange(0); // Actual
    const month1 = getMonthRange(1); // Hace 1 mes
    const month2 = getMonthRange(2); // Hace 2 meses

    const getIngresosMes = async (start: string, end: string) => {
        const { data } = await supabase.from("pagos").select("monto").eq("estado", "saldado").gte("fecha", start).lte("fecha", end);
        return data?.reduce((acc, p) => acc + (p.monto || 0), 0) || 0;
    };

    const ingresosDelMes = await getIngresosMes(month0.start, month0.end);
    const ingresosMes1 = await getIngresosMes(month1.start, month1.end);
    const ingresosMes2 = await getIngresosMes(month2.start, month2.end);

    const trendData = [
        { month: month2.name, total: ingresosMes2 },
        { month: month1.name, total: ingresosMes1 },
        { month: month0.name, total: ingresosDelMes }
    ];

    // Estudiantes que faltan por pagar este mes
    let countPendientes = 0;
    let metaTotal = 0;

    if (estudiantes) {
        for (const est of estudiantes) {
            const cuota = est.cuota_mensual || 11000;
            metaTotal += cuota;

            const { data: pagosEst } = await supabase
                .from("pagos")
                .select("monto")
                .eq("estudiante_id", est.id)
                .eq("estado", "saldado")
                .gte("fecha", month0.start)
                .lte("fecha", month0.end);

            const totalPagado = pagosEst?.reduce((acc, p) => acc + (p.monto || 0), 0) || 0;

            if (totalPagado < cuota) {
                countPendientes++;
            }
        }
    }

    // Cálculo de Efectividad: Capado al 100% por estudiante para evitar porcentajes > 100
    let sumaEficiencia = 0;
    if (estudiantes) {
        for (const est of estudiantes) {
            const cuota = est.cuota_mensual || 11000;
            const { data: pEst } = await supabase.from("pagos").select("monto").eq("estudiante_id", est.id).eq("estado", "saldado").gte("fecha", month0.start).lte("fecha", month0.end);
            const totalP = pEst?.reduce((acc, p) => acc + (p.monto || 0), 0) || 0;
            sumaEficiencia += Math.min(1, totalP / cuota);
        }
    }
    const porcentajeCobro = (estudiantes?.length || 0) > 0 ? Math.round((sumaEficiencia / (estudiantes?.length || 0)) * 100) : 0;

    // 3. Datos para la Previsualización y Métricas Directas
    const { data: allComunicados } = await supabase.from("comunicados").select("*").order("created_at", { ascending: false });
    const { data: galeria } = await supabase.from("galeria").select("*").order("created_at", { ascending: false }).limit(6);
    const { data: eventos } = await supabase.from("eventos").select("*").order("fecha", { ascending: true }).limit(3);
    const { data: agradecimientos } = await supabase.from("agradecimientos").select("*").order("created_at", { ascending: false }).limit(2);

    return (
        <div className="min-h-screen bg-slate-50 pb-12">
            <DirectorDashboardClient
                estudiantes={estudiantes || []}
                padres={padres || []}
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
