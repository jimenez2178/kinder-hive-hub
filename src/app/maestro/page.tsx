export const dynamic = "force-dynamic";

import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import CompactTeacherDashboard from "./components/CompactTeacherDashboard";

export default async function MaestroPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect("/login");
    }

    // Fetch the teacher profile
    const { data: profile } = await supabase
        .from("perfiles")
        .select("nombre_completo")
        .eq("id", user.id)
        .single();
        
    const maestroNombre = profile?.nombre_completo || "Maestro(a)";

    return (
        <CompactTeacherDashboard
            maestroNombre={maestroNombre}
        />
    );
}

