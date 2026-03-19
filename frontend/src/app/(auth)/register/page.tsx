"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Cookies from "js-cookie";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const registerSchema = z
    .object({
        name: z.string().min(1, "Nome obrigatório"),
        email: z.email("E-mail inválido"),
        password: z.string().min(8, "Mínimo 8 caracteres"),
        password_confirmation: z.string().min(1, "Confirme a senha"),
    })
    .refine((data) => data.password === data.password_confirmation, {
        message: "Senhas não conferem",
        path: ["password_confirmation"],
    });

type RegisterForm = z.infer<typeof registerSchema>;

export default function RegisterPage() {
    const router = useRouter();
    const [apiError, setApiError] = useState("");
    const [loading, setLoading] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<RegisterForm>({
        resolver: zodResolver(registerSchema),
    });

    async function onSubmit(data: RegisterForm) {
        setApiError("");
        setLoading(true);

        try {
            const response = await api.post("/register", data);
            Cookies.set("token", response.data.token, { expires: 7 });
            Cookies.set("user", JSON.stringify(response.data.user), { expires: 7 });
            router.push("/");
        } catch (error) {
            const err = error as { message?: string; errors?: Record<string, string[]> };
            if (err.errors) {
                const firstError = Object.values(err.errors).flat()[0];
                setApiError(firstError ?? "Erro ao registrar.");
            } else {
                setApiError(err.message || "Erro ao registrar.");
            }
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle className="text-2xl text-center">Criar Conta</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        {apiError && (
                            <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md">
                                {apiError}
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="name">Nome</Label>
                            <Input
                                id="name"
                                placeholder="Seu nome"
                                {...register("name")}
                            />
                            {errors.name && (
                                <p className="text-sm text-destructive">{errors.name.message}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="email">E-mail</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="seu@email.com"
                                {...register("email")}
                            />
                            {errors.email && (
                                <p className="text-sm text-destructive">{errors.email.message}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="password">Senha</Label>
                            <Input
                                id="password"
                                type="password"
                                placeholder="••••••••"
                                {...register("password")}
                            />
                            {errors.password && (
                                <p className="text-sm text-destructive">{errors.password.message}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="password_confirmation">Confirmar Senha</Label>
                            <Input
                                id="password_confirmation"
                                type="password"
                                placeholder="••••••••"
                                {...register("password_confirmation")}
                            />
                            {errors.password_confirmation && (
                                <p className="text-sm text-destructive">
                                    {errors.password_confirmation.message}
                                </p>
                            )}
                        </div>

                        <Button type="submit" className="w-full" disabled={loading}>
                            {loading ? "Registrando..." : "Registrar"}
                        </Button>

                        <p className="text-sm text-center text-muted-foreground">
                            Já tem conta?{" "}
                            <Link href="/login" className="text-primary underline">
                                Faça login
                            </Link>
                        </p>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}