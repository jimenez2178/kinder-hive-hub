export const dynamic = "force-dynamic";

import { getFraseDelDia } from "@/lib/n8n";
import DashboardClient from "../../components/DashboardClient";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect("/login");
    }

    const fraseDelDia = await getFraseDelDia();

    // 1. Perfil del padre y su Colegio ID y TELÉFONO
    const { data: profile } = await supabase
        .from("perfiles")
        .select("nombre, colegio_id, telefono")
        .eq("id", user.id)
        .single();

    const colegioId = profile?.colegio_id;

    // AUTO-REPARACIÓN: Si el usuario existe pero no tiene colegio_id, se lo ponemos
    if (profile && !colegioId) {
        await supabase
            .from("perfiles")
            .update({ colegio_id: "bd8d5b9b-cb69-4d9e-83cd-84e80b792992" })
            .eq("id", user.id);
    }

    // 2. Estudiantes asociados: ID Directo + Match por Email + Match por Nombre
    // MUY IMPORTANTE: Traemos colegio_id para asegurar que el dashboard sepa a qué colegio pertenece el niño
    const { data: rawEstudiantes } = await supabase
        .from("estudiantes")
        .select("id, nombre, grado, cuota_mensual, tutor_nombre, telefono_tutor, nombre_madre, telefono_madre, colegio_id")
        .or(`padre_id.eq.${user.id},tutor_nombre.ilike.%${user.email}%,tutor_nombre.ilike.%${profile?.nombre}%,nombre_madre.ilike.%${profile?.nombre}%`);

    const estudiantes = rawEstudiantes?.map(est => ({
        ...est,
        padre_telefono: profile?.telefono || ""
    })) || [];

    // 2.5 Resolución inteligente de Colegio ID
    // Si el perfil no lo tiene, lo tomamos del primer niño. Si no hay niños, usamos el default de Sagrada Familia.
    let finalColegioId = profile?.colegio_id;
    if (!finalColegioId && estudiantes && estudiantes.length > 0) {
        finalColegioId = estudiantes[0].colegio_id;
    }
    // Fallback final: ID de Sagrada Familia (para que vean noticias globales aunque no tengan niños registrados aún)
    if (!finalColegioId) {
        finalColegioId = "bd8d5b9b-cb69-4d9e-83cd-84e80b792992";
    }

    // 3. Cálculo de Saldo Dinámico Consolidado (Total de la Familia)
    let saldoTotalFamilia = 0;
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    if (estudiantes && estudiantes.length > 0) {
        // Obtenemos los IDs de todos los estudiantes para buscar sus pagos en una sola consulta o por ciclo
        for (const est of estudiantes) {
            // Rango del mes actual para pagos saldados
            const startDate = `${currentYear}-${String(currentMonth).padStart(2, '0')}-01`;
            const endDate = `${currentYear}-${String(currentMonth).padStart(2, '0')}-31`;

            const { data: pagosMes } = await supabase
                .from("pagos")
                .select("monto")
                .eq("estudiante_id", est.id)
                .eq("estado", "saldado")
                .gte("fecha", startDate)
                .lte("fecha", endDate);

            const totalPagadoMes = pagosMes?.reduce((acc, p) => acc + (Number(p.monto) || 0), 0) || 0;
            const cuotaEstudiante = Number(est.cuota_mensual) || 11000;

            // El saldo de este niño es Su Cuota - Lo que ha pagado este mes
            const saldoNiño = Math.max(0, cuotaEstudiante - totalPagadoMes);
            saldoTotalFamilia += saldoNiño;
        }
    }

    // 4. Comunicado Urgente (Filtrado por Colegio Dinámico)
    const { data: comunicados } = await supabase
        .from("comunicados")
        .select("*")
        .eq("colegio_id", finalColegioId)
        .order("created_at", { ascending: false })
        .limit(1);

    // 5. Fotos de la Galería (Filtrado por Colegio Dinámico)
    const { data: galeria } = await supabase
        .from("galeria")
        .select("*")
        .eq("colegio_id", finalColegioId)
        .order("created_at", { ascending: false })
        .limit(6);

    // 6. Historial de Recibos
    const { data: recibos } = await supabase
        .from("pagos")
        .select("*, estudiantes(nombre, tipo_tutor, tutor_nombre, telefono_tutor, nombre_madre, telefono_madre)")
        .in("estudiante_id", estudiantes?.map(e => e.id) || [])
        .order("fecha", { ascending: false });

    const todayStr = new Date().toISOString().split('T')[0];
    const { data: eventos } = await supabase
        .from("eventos")
        .select("*")
        .eq("colegio_id", finalColegioId)
        .gte("fecha", todayStr)
        .order("fecha", { ascending: true })
        .limit(3);

    // 8. Espacio de Agradecimientos (Filtrado por Colegio Dinámico)
    const { data: agradecimientos } = await supabase
        .from("agradecimientos")
        .select("*")
        .eq("colegio_id", finalColegioId)
        .order("created_at", { ascending: false })
        .limit(2);

    // 9. Evaluaciones Académicas
    const { data: evaluaciones } = await supabase
        .from("evaluaciones")
        .select("*, estudiantes(nombre)")
        .in("estudiante_id", estudiantes?.map(e => e.id) || [])
        .order("created_at", { ascending: false });

    return (
        <DashboardClient
            initialFrase={fraseDelDia}
            userName={profile?.nombre || "Padre"}
            saldoPendiente={saldoTotalFamilia}
            estudiantes={estudiantes || []}
            comunicado={comunicados?.[0]}
            galeria={galeria || []}
            recibos={recibos || []}
            eventos={eventos || []}
            agradecimientos={agradecimientos || []}
            evaluaciones={evaluaciones || []}
        />
    );
}


