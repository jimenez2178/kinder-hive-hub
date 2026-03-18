export const dynamic = "force-dynamic";

import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { TeacherDashboardClient } from "./components/TeacherDashboardClient";

export default async function MaestroPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect("/login");
    }

    // Fetch student list for the dropdown
    const { data: estudiantes, error } = await supabase.from("estudiantes").select("*");

    // Fetch the teacher profile
    const { data: profile } = await supabase
        .from("perfiles")
        .select("nombre_completo")
        .eq("id", user.id)
        .single();
        
    const maestroNombre = profile?.nombre_completo || "Maestro(a)";

    // Fetch comments left by this teacher
    const { data: evaluaciones } = await supabase
        .from("evaluaciones")
        .select("*, estudiantes(nombre), perfiles!evaluaciones_maestro_id_fkey(nombre_completo)")
        .eq("maestro_id", user.id)
        .order("created_at", { ascending: false });

    return (
        <div className="min-h-screen bg-slate-50 pb-12">
            <TeacherDashboardClient
                estudiantes={estudiantes || []}
                evaluaciones={evaluaciones || []}
                maestroNombre={maestroNombre}
            />
        </div>
    );
}
