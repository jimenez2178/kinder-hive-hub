"use client";

import { Button } from "@/components/ui/button";
import { createClient } from "@/utils/supabase/client";

export function LogoutButton() {
    const handleLogout = async () => {
        try {
            const supabase = createClient();
            
            // 1. Sign out on the client
            await supabase.auth.signOut();

            // 2. Unregister all service workers
            if ("serviceWorker" in navigator) {
                const registrations = await navigator.serviceWorker.getRegistrations();
                for (const registration of registrations) {
                    await registration.unregister();
                }
            }

            // 3. Clear Caches
            if ("caches" in window) {
                const cacheNames = await caches.keys();
                await Promise.all(cacheNames.map(name => caches.delete(name)));
            }

            // 4. Force hard redirect to home (clears server-side redirect loops)
            window.location.href = "/";
        } catch (error) {
            console.error("Logout error:", error);
            // Fallback redirect
            window.location.href = "/";
        }
    };

    return (
        <Button
            type="button"
            variant="outline"
            onClick={handleLogout}
            className="rounded-[32px] border-2 border-red-200 text-red-600 hover:bg-red-50 font-bold px-6 h-10 transition-all active:scale-95 relative z-50"
        >
            Cerrar Sesión
        </Button>
    );
}
