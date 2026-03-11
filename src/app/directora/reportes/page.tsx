export const dynamic = "force-dynamic";

import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { FinancialReportClient } from "./components/FinancialReportClient";

export default async function ReportesPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect("/login");
    }

    // 1. Fetch all students to calculate expected income
    const { data: estudiantes } = await supabase
        .from("estudiantes")
        .select("id, nombre, grado, cuota_mensual, padre_id")
        .order("grado", { ascending: true });

    // 2. Fetch current month payments
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();
    const startDate = `${currentYear}-${String(currentMonth).padStart(2, '0')}-01`;
    const endDate = `${currentYear}-${String(currentMonth).padStart(2, '0')}-31`;

    const { data: pagos } = await supabase
        .from("pagos")
        .select("*, estudiantes(nombre, grado)")
        .gte("fecha", startDate)
        .lte("fecha", endDate);

    // 3. Prepare data for the client component
    // We want to know: Who paid? Who didn't? Total sums.

    return (
        <FinancialReportClient
            estudiantes={estudiantes || []}
            pagos={pagos || []}
            month={now.toLocaleDateString('es-DO', { month: 'long' })}
            year={currentYear}
        />
    );
}
