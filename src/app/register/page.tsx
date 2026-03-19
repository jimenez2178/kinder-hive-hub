"use client";

import { useActionState } from "react"
import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { registerAction } from "@/app/actions/register"
import Link from "next/link"

export default function RegisterForm() {
    const [state, formAction, isPending] = useActionState(registerAction, null);

    // SUCCESS STATE — show a clean confirmation message, no redirect needed
    if (state?.success && state?.successMessage) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-muted/20 p-4">
                <div className="max-w-sm w-full bg-white rounded-[2rem] shadow-2xl p-10 text-center border-t-8 border-[#8A2BE2]">
                    <div className="text-6xl mb-6">✅</div>
                    <h2 className="text-2xl font-black text-[#002147] mb-3 tracking-tight">¡Solicitud Enviada!</h2>
                    <p className="text-slate-600 font-semibold leading-relaxed mb-8">
                        {state.successMessage}
                    </p>
                    <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest">
                        La directora revisará tu solicitud y te notificará pronto.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-muted/20 p-4">
            {/* Brand Header */}
            <div className="mb-8 text-center text-balance px-4">
                <img
                    src="https://informativolatelefonica.com/wp-content/uploads/2026/03/LOGO.png"
                    alt="Logo Sagrada Familia"
                    className="w-24 h-24 mx-auto mb-4 object-contain"
                />
                <h1 className="text-xl font-black tracking-tight text-[#004aad] uppercase">
                    Registro de Padres
                </h1>
                <p className="text-[#8A2BE2] mt-1 font-black uppercase tracking-widest text-[9px]">
                    Crea tu cuenta para acceder al portal familiar
                </p>
            </div>

            <Card className="mx-auto max-w-sm w-full rounded-[2rem] border-0 shadow-2xl bg-white">
                <CardHeader className="text-center pb-2">
                    <CardTitle className="text-2xl font-bold">Unirse a la Comunidad</CardTitle>
                    <CardDescription>
                        Completa tus datos para empezar
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form action={formAction} className="grid gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="nombre_completo" className="font-semibold ml-1 text-xs uppercase">Tu Nombre Completo</Label>
                            <Input
                                id="nombre_completo"
                                name="nombre_completo"
                                placeholder="Ej: Jesús Jiménez"
                                required
                                className="rounded-2xl h-11 shadow-sm"
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="nombre_alumno" className="font-semibold ml-1 text-xs uppercase">Nombre del Alumno(a)</Label>
                            <Input
                                id="nombre_alumno"
                                name="nombre_alumno"
                                placeholder="Ej: Juan Pérez"
                                required
                                className="rounded-2xl h-11 shadow-sm"
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="email" className="font-semibold ml-1 text-xs uppercase text-foreground">Correo Electrónico</Label>
                            <Input
                                id="email"
                                name="email"
                                type="email"
                                placeholder="tu@email.com"
                                required
                                className="rounded-2xl h-11 shadow-sm"
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="password" className="font-semibold ml-1 text-xs uppercase text-foreground">Contraseña</Label>
                            <Input
                                id="password"
                                name="password"
                                type="password"
                                required
                                placeholder="••••••••"
                                className="rounded-2xl h-11 shadow-sm"
                            />
                        </div>

                        {state?.error && (
                            <div className="text-xs font-bold text-destructive text-center bg-destructive/10 p-3 rounded-2xl">
                                ⚠️ {state.error}
                            </div>
                        )}

                        <Button type="submit" disabled={isPending} className="w-full h-12 rounded-2xl mt-4 text-base font-bold bg-[#8A2BE2] hover:bg-[#6e22b5] shadow-lg shadow-[#8A2BE2]/20">
                            {isPending ? "Creando Cuenta..." : "Registrarme Ahora"}
                        </Button>

                        <div className="text-center mt-4">
                            <p className="text-sm text-slate-500 font-medium">
                                ¿Ya tienes cuenta?{" "}
                                <Link href="/login" className="text-[#004aad] font-black hover:underline">
                                    Inicia Sesión
                                </Link>
                            </p>
                        </div>
                    </form>
                </CardContent>
            </Card>

            <footer className="mt-12 text-center text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                <p>© {new Date().getFullYear()} Pre-escolar Sagrada Familia</p>
            </footer>
        </div>
    )
}
