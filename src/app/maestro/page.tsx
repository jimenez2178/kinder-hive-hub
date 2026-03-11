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

    return (
        <div className="min-h-screen bg-slate-50 pb-12">
            <TeacherDashboardClient
                estudiantes={estudiantes || []}
            />
        </div>
    );
}
