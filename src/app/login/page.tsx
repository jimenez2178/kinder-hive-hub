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
import { loginAction } from "@/app/actions/auth"
import Link from "next/link"

export default function LoginForm() {
    const [state, formAction, isPending] = useActionState(loginAction, null);

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-muted/20 p-4">
            {/* Brand Header */}
            <div className="mb-8 text-center text-balance px-4">
                <img
                    src="https://informativolatelefonica.com/wp-content/uploads/2026/03/LOGO.png"
                    alt="Logo Sagrada Familia"
                    className="w-32 h-32 mx-auto mb-4 object-contain"
                />
                <h1 className="text-2xl font-black tracking-tight text-[#004aad] uppercase">
                    Pre-escolar Psicopedagógico de la Sagrada Familia
                </h1>
                <p className="text-[#8A2BE2] mt-2 font-black uppercase tracking-widest text-[10px]">
                    Educando con Amor y Propósito
                </p>
            </div>

            <Card className="mx-auto max-w-sm w-full rounded-[2rem] border-0 shadow-xl bg-gradient-to-br from-background to-muted/30">
                <CardHeader className="text-center pb-2">
                    <CardTitle className="text-2xl font-bold">Iniciar Sesión</CardTitle>
                    <CardDescription>
                        Ingresa tus credenciales para acceder a tu portal
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form action={formAction} className="grid gap-6">
                        <div className="grid gap-2">
                            <Label htmlFor="email" className="font-semibold ml-1">
                                Correo Electrónico
                            </Label>
                            <Input
                                id="email"
                                name="email"
                                type="email"
                                placeholder="usuario@colegio.edu.do"
                                required
                                className="rounded-3xl h-12 shadow-sm focus-visible:ring-primary"
                            />
                        </div>
                        <div className="grid gap-2 mt-2">
                            <div className="flex items-center justify-between ml-1">
                                <Label htmlFor="password" className="font-semibold text-foreground">Contraseña</Label>
                                <a href="#" className="text-sm font-medium text-primary hover:underline underline-offset-4">
                                    ¿Olvidaste tu contraseña?
                                </a>
                            </div>
                            <Input
                                id="password"
                                name="password"
                                type="password"
                                required
                                className="rounded-3xl h-12 shadow-sm focus-visible:ring-primary"
                            />
                        </div>

                        {state?.error && (
                            <div className="text-sm font-medium text-destructive text-center">
                                {state.error}
                            </div>
                        )}

                        <Button type="submit" disabled={isPending} className="w-full h-12 rounded-3xl mt-4 text-base font-semibold shadow-md">
                            {isPending ? "Ingresando..." : "Entrar al Portal"}
                        </Button>

                        <div className="text-center mt-4">
                            <p className="text-sm text-slate-500 font-medium">
                                ¿No tienes cuenta?{" "}
                                <Link href="/register" className="text-[#004aad] font-black hover:underline">
                                    Regístrate aquí
                                </Link>
                            </p>
                        </div>
                    </form>
                </CardContent>
            </Card>

            {/* Footer Branding */}
            <footer className="mt-16 text-center text-sm text-muted-foreground">
                <p>© {new Date().getFullYear()} Pre-escolar Psicopedagógico de la Sagrada Familia</p>
            </footer>
        </div>
    )
}
