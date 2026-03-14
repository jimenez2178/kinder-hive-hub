"use client";

import { logoutAction } from "@/app/actions/auth";

export default function EsperaPage() {
    const handleLogout = async () => {
        await logoutAction();
        // Force a full clean redirect to login and clear any client cache
        window.location.href = "/login";
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
            <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 text-center border-t-8 border-yellow-400">
                <div className="mb-6">
                    <span className="text-6xl text-yellow-500">⏳</span>
                </div>
                <h1 className="text-3xl font-bold text-gray-800 mb-4">¡Hemos recibido tu solicitud!</h1>
                <p className="text-gray-600 mb-8">
                    Tu cuenta está actualmente en estado <strong>pendiente</strong> de aprobación por parte de la dirección del centro.
                </p>
                <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-8 text-left italic text-sm text-blue-800">
                    "Estamos verificando tus datos para garantizar la seguridad de todos nuestros alumnos. Recibirás una notificación en cuanto tu acceso sea habilitado."
                </div>
                <div className="flex flex-col gap-3">
                    <button 
                        type="button"
                        onClick={() => {
                            // Limpiar cookies y caché local antes de recargar
                            if ("caches" in window) {
                                caches.keys().then(names => {
                                    for (let name of names) caches.delete(name);
                                });
                            }
                            // Recarga forzada ignorando caché
                            window.location.reload();
                        }}
                        className="w-full bg-[#7ed957] hover:bg-[#6ec54a] text-[#020617] font-black py-4 px-6 rounded-2xl shadow-lg hover:scale-[1.02] transition-all"
                    >
                        Ya fui aprobado, entrar ahora
                    </button>
                    
                    <button 
                        type="button"
                        onClick={handleLogout}
                        className="w-full bg-slate-100 hover:bg-slate-200 text-slate-500 font-bold py-3 px-6 rounded-2xl transition-all text-sm"
                    >
                        Cerrar Sesión / Volver
                    </button>
                </div>
            </div>
            <p className="mt-8 text-gray-400 text-sm">
                Kinder Hive Hub
            </p>
        </div>
    );
}
