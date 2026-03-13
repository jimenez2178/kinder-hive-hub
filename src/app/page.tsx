import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";

export default async function IndexPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect("/login");
    }

    const { data: profile } = await supabase
        .from("perfiles")
        .select("rol, estado")
        .eq("id", user.id)
        .single();

    if (profile?.estado === "pendiente") {
        redirect("/espera");
    }

    if (profile?.rol === "directora") {
        redirect("/dashboard/directora");
    } else if (profile?.rol === "maestro") {
        redirect("/maestro");
    } else {
        redirect("/dashboard/padre");
    }
}
