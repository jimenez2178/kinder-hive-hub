"use client";

import { Button } from "@/components/ui/button";
import { logoutAction } from "@/app/actions/auth";

export function LogoutButton() {
    const handleLogout = async () => {
        await logoutAction();
        // Force a full clean redirect to login and clear any client cache
        window.location.href = "/login";
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
