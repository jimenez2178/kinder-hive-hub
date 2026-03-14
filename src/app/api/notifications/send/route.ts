import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";
import webpush from "web-push";

const vapidKeys = {
    publicKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "",
    privateKey: process.env.VAPID_PRIVATE_KEY || "",
};

webpush.setVapidDetails(
    'mailto:admin@kinderhivehub.com',
    vapidKeys.publicKey,
    vapidKeys.privateKey
);

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { userId, title, message, url } = body;

        const supabase = await createClient();

        let profiles = [];
        if (userId) {
            const { data } = await supabase
                .from("perfiles")
                .select("push_token")
                .eq("id", userId);
            profiles = data || [];
        } else {
            const { data } = await supabase
                .from("perfiles")
                .select("push_token")
                .not("push_token", "is", null);
            profiles = data || [];
        }

        const notifications = profiles.map(async (profile: any) => {
            if (!profile.push_token) return null;
            try {
                const subscription = JSON.parse(profile.push_token);
                return await webpush.sendNotification(
                    subscription,
                    JSON.stringify({
                        title: title || "Kinder Hive Hub",
                        body: message || "Tienes una nueva notificación",
                        url: url || "/dashboard/padre",
                    })
                );
            } catch (err) {
                console.error("Error sending notification:", err);
                return null;
            }
        });

        await Promise.all(notifications);

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
