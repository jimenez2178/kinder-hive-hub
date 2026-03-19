"use client";

import { useEffect } from "react";
import { createClient } from "@/utils/supabase/client";

export default function PushNotificationManager() {
    useEffect(() => {
        const supabase = createClient();
        if (typeof window === "undefined") return;

        if ("serviceWorker" in navigator) {
            navigator.serviceWorker
                .register("/sw.js")
                .then((registration) => {
                    console.log("Service Worker registered with scope:", registration.scope);
                })
                .catch((error) => {
                    console.error("Service Worker registration failed:", error);
                });
        }

        // Suggest permission request on login or interaction
        const requestPermission = async () => {
            if (!("Notification" in window)) return;

            const permission = await Notification.requestPermission();
            if (permission === "granted") {
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                    // OneSignal or FCM logic to get token and update Supabase
                    // const token = await getPushToken(); 
                    // await supabase.from('perfiles').update({ push_token: token }).eq('id', user.id);
                    console.info("Push permission granted. Ready for integration with FCM/OneSignal.");
                }
            }
        };

        requestPermission();
    }, []);

    return null;
}
