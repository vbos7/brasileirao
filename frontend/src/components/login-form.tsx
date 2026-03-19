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
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

const loginSchema = z.object({
    email: z.email("E-mail inválido"),
    password: z.string().min(1, "Senha obrigatória"),
});

type LoginFormData = z.infer<typeof loginSchema>;

export function LoginForm({ className, ...props }: React.ComponentProps<"div">) {
    const router = useRouter();
    const [apiError, setApiError] = useState("");
    const [loading, setLoading] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<LoginFormData>({
        resolver: zodResolver(loginSchema),
    });

    async function onSubmit(data: LoginFormData) {
        setApiError("");
        setLoading(true);
        try {
            const response = await api.post("/login", data);
            Cookies.set("token", response.data.token, { expires: 7 });
            Cookies.set("user", JSON.stringify(response.data.user), { expires: 7 });
            window.dispatchEvent(new Event("user-updated"));
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
        <div className={cn("flex flex-col gap-6", className)} {...props}>
            <Card className="overflow-hidden p-0">
                <CardContent className="grid p-0 md:grid-cols-2">
                    <form className="p-6 md:p-8" onSubmit={handleSubmit(onSubmit)}>
                        <FieldGroup>
                            <div className="flex flex-col items-center gap-2 text-center">
                                <h1 className="text-2xl font-bold">Bem-vindo de volta!</h1>
                                <p className="text-balance text-muted-foreground">
                                    Faça login em sua conta
                                </p>
                            </div>

                            {apiError && (
                                <p className="text-sm text-destructive text-center">{apiError}</p>
                            )}

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
                                <Button type="submit" className="w-full" disabled={loading}>
                                    {loading ? "Entrando..." : "Entrar"}
                                </Button>
                            </Field>

                            {/*<FieldSeparator className="*:data-[slot=field-separator-content]:bg-card">*/}
                            {/*    Ou continue com*/}
                            {/*</FieldSeparator>*/}

                            <Field>
                                {/*<Button variant="outline" type="button" className="w-full">*/}
                                {/*    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">*/}
                                {/*        <path*/}
                                {/*            d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"*/}
                                {/*            fill="currentColor"*/}
                                {/*        />*/}
                                {/*    </svg>*/}
                                {/*    Entrar com Google*/}
                                {/*</Button>*/}
                                {/*<Button variant="outline" type="button" className="w-full">*/}
                                {/*    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">*/}
                                {/*        <path*/}
                                {/*            d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"*/}
                                {/*            fill="currentColor"*/}
                                {/*        />*/}
                                {/*    </svg>*/}
                                {/*    Entrar com GitHub*/}
                                {/*</Button>*/}
                                <FieldDescription className="text-center">
                                    Não tem uma conta?{" "}
                                    <Link href="/register" className="underline underline-offset-4">
                                        Registre-se
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
