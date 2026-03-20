"use client";

import { useEffect } from "react";

export default function PushNotificationManager() {
    useEffect(() => {
        if (typeof window === "undefined") return;

        if ("serviceWorker" in navigator) {
            navigator.serviceWorker
                .register("/sw.js")
                .then((registration) => {
                    console.log("Service Worker registrado correctamente (Scope:", registration.scope + ")");
                })
                .catch((error) => {
                    console.error("Error al registrar el Service Worker:", error);
                });
        }
    }, []);

    return null;
}
