"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import Cookies from "js-cookie";
import { cn } from "@/lib/utils";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Field, FieldDescription, FieldGroup, FieldLabel, FieldSeparator } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

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

type RegisterFormData = z.infer<typeof registerSchema>;

export function RegisterForm({ className, ...props }: React.ComponentProps<"div">) {
    const router = useRouter();
    const [apiError, setApiError] = useState("");
    const [loading, setLoading] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<RegisterFormData>({
        resolver: zodResolver(registerSchema),
    });

    async function onSubmit(data: RegisterFormData) {
        setApiError("");
        setLoading(true);
        try {
            const response = await api.post("/register", data);
            Cookies.set("token", response.data.token, { expires: 7 });
            Cookies.set("user", JSON.stringify(response.data.user), { expires: 7 });
            window.dispatchEvent(new Event("user-updated"));
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
        <div className={cn("flex flex-col gap-6", className)} {...props}>
            <Card className="overflow-hidden p-0">
                <CardContent className="grid p-0 md:grid-cols-2">
                    <form className="p-6 md:p-8" onSubmit={handleSubmit(onSubmit)}>
                        <FieldGroup>
                            <div className="flex flex-col items-center gap-2 text-center">
                                <h1 className="text-2xl font-bold">Criar conta</h1>
                                <p className="text-balance text-muted-foreground">
                                    Preencha os dados abaixo para se registrar
                                </p>
                            </div>

                            {apiError && (
                                <p className="text-sm text-destructive text-center">{apiError}</p>
                            )}

                            <Field>
                                <FieldLabel htmlFor="name">Nome</FieldLabel>
                                <Input
                                    id="name"
                                    type="text"
                                    placeholder="Seu nome"
                                    {...register("name")}
                                />
                                {errors.name && (
                                    <p className="text-sm text-destructive">{errors.name.message}</p>
                                )}
                            </Field>

                            <Field>
                                <FieldLabel htmlFor="email">E-mail</FieldLabel>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="seu@email.com"
                                    {...register("email")}
                                />
                                {errors.email && (
                                    <p className="text-sm text-destructive">{errors.email.message}</p>
                                )}
                            </Field>

                            <Field>
                                <FieldLabel htmlFor="password">Senha</FieldLabel>
                                <Input
                                    id="password"
                                    type="password"
                                    {...register("password")}
                                />
                                {errors.password && (
                                    <p className="text-sm text-destructive">{errors.password.message}</p>
                                )}
                            </Field>

                            <Field>
                                <FieldLabel htmlFor="password_confirmation">Confirmar senha</FieldLabel>
                                <Input
                                    id="password_confirmation"
                                    type="password"
                                    {...register("password_confirmation")}
                                />
                                {errors.password_confirmation && (
                                    <p className="text-sm text-destructive">
                                        {errors.password_confirmation.message}
                                    </p>
                                )}
                            </Field>

                            <Field>
                                <Button type="submit" className="w-full" disabled={loading}>
                                    {loading ? "Registrando..." : "Registrar"}
                                </Button>
                            </Field>

                            <FieldSeparator className="*:data-[slot=field-separator-content]:bg-card">
                                Ou continue
                            </FieldSeparator>

                            <Field>
                                <Button variant="outline" type="button" className="w-full" onClick={() => router.push("/")}>
                                    Entrar como visitante
                                </Button>
                                <FieldDescription className="text-center">
                                    Já tem uma conta?{" "}
                                    <Link href="/login" className="underline underline-offset-4">
                                        Faça login
                                    </Link>
                                </FieldDescription>
                            </Field>
                        </FieldGroup>
                    </form>
                    <div className="relative hidden bg-muted md:block">
                        <Image
                            src="/image-1.png"
                            alt=""
                            fill
                            className="object-cover dark:brightness-[0.2] dark:grayscale"
                        />
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
