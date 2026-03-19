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

const loginSchema = z.object({
    email: z.email("E-mail inválido"),
    password: z.string().min(1, "Senha obrigatória"),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
    const router = useRouter();
    const [apiError, setApiError] = useState("");
    const [loading, setLoading] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<LoginForm>({
        resolver: zodResolver(loginSchema),
    });

    async function onSubmit(data: LoginForm) {
        setApiError("");
        setLoading(true);

        try {
            const response = await api.post("/login", data);
            Cookies.set("token", response.data.token, { expires: 7 });
            Cookies.set("user", JSON.stringify(response.data.user), { expires: 7 });

            const user = response.data.user;
            router.push(user.role === "admin" ? "/admin/games" : "/");
        } catch (error) {
            const err = error as { message?: string };
            setApiError(err.message || "Erro ao fazer login.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle className="text-2xl text-center">Login</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        {apiError && (
                            <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md">
                                {apiError}
                            </div>
                        )}

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

                        <Button type="submit" className="w-full" disabled={loading}>
                            {loading ? "Entrando..." : "Entrar"}
                        </Button>

                        <p className="text-sm text-center text-muted-foreground">
                            Não tem conta?{" "}
                            <Link href="/register" className="text-primary underline">
                                Registre-se
                            </Link>
                        </p>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}