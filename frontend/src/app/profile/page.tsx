"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import Cookies from "js-cookie";
import api from "@/lib/api";
import { User } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

const profileSchema = z.object({
    name: z.string().min(1, "Nome obrigatório"),
    email: z.email("E-mail inválido"),
});

const passwordSchema = z
    .object({
        current_password: z.string().min(1, "Senha atual obrigatória"),
        password: z.string().min(8, "Mínimo 8 caracteres"),
        password_confirmation: z.string().min(1, "Confirme a nova senha"),
    })
    .refine((data) => data.password === data.password_confirmation, {
        message: "Senhas não conferem",
        path: ["password_confirmation"],
    });

type ProfileForm = z.infer<typeof profileSchema>;
type PasswordForm = z.infer<typeof passwordSchema>;

function getDefaultValues(): ProfileForm {
    try {
        const stored = Cookies.get("user");
        if (stored) {
            const user: User = JSON.parse(stored);
            return { name: user.name, email: user.email };
        }
    } catch {}
    return { name: "", email: "" };
}

export default function ProfilePage() {
    const [submittingProfile, setSubmittingProfile] = useState(false);
    const [submittingPassword, setSubmittingPassword] = useState(false);
    const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);

    const profileForm = useForm<ProfileForm>({
        resolver: zodResolver(profileSchema),
        defaultValues: getDefaultValues(),
    });

    const passwordForm = useForm<PasswordForm>({
        resolver: zodResolver(passwordSchema),
    });

    async function onProfileSubmit(data: ProfileForm) {
        setSubmittingProfile(true);
        try {
            const response = await api.put("/profile", data);
            const updatedUser = response.data.user || response.data;

            Cookies.set("user", JSON.stringify(updatedUser), { expires: 7 });
            window.dispatchEvent(new Event("user-updated"));
            toast.success("Perfil atualizado.");
        } catch (error) {
            const err = error as { message?: string; errors?: Record<string, string[]> };
            if (err.errors) {
                const firstError = Object.values(err.errors).flat()[0] ?? "Erro ao atualizar perfil.";
                toast.error(firstError);
            } else {
                toast.error(err.message || "Erro ao atualizar perfil.");
            }
        } finally {
            setSubmittingProfile(false);
        }
    }

    async function onPasswordSubmit(data: PasswordForm) {
        setSubmittingPassword(true);
        try {
            await api.put("/profile", {
                current_password: data.current_password,
                password: data.password,
                password_confirmation: data.password_confirmation,
            });
            passwordForm.reset();
            setPasswordDialogOpen(false);
            toast.success("Senha alterada.");
        } catch (error) {
            const err = error as { message?: string; errors?: Record<string, string[]> };
            if (err.errors) {
                const firstError = Object.values(err.errors).flat()[0] ?? "Erro ao alterar senha.";
                toast.error(firstError);
            } else {
                toast.error(err.message || "Erro ao alterar senha.");
            }
        } finally {
            setSubmittingPassword(false);
        }
    }

    return (
        <div className="min-h-screen bg-background p-4 md:p-8">
            <div className="mx-auto max-w-md space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-2xl">Meu Perfil</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Nome</Label>
                                <Input id="name" {...profileForm.register("name")} />
                                {profileForm.formState.errors.name && (
                                    <p className="text-sm text-destructive">
                                        {profileForm.formState.errors.name.message}
                                    </p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="email">E-mail</Label>
                                <Input id="email" type="email" {...profileForm.register("email")} />
                                {profileForm.formState.errors.email && (
                                    <p className="text-sm text-destructive">
                                        {profileForm.formState.errors.email.message}
                                    </p>
                                )}
                            </div>

                            <Button
                                type="button"
                                variant="outline"
                                className="w-full"
                                onClick={() => {
                                    passwordForm.reset();
                                    setPasswordDialogOpen(true);
                                }}
                            >
                                Alterar Senha
                            </Button>

                            <Button type="submit" className="w-full" disabled={submittingProfile}>
                                {submittingProfile ? "Salvando..." : "Salvar"}
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Alterar Senha</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="current_password">Senha Atual</Label>
                                <Input
                                    id="current_password"
                                    type="password"
                                    placeholder="••••••••"
                                    {...passwordForm.register("current_password")}
                                />
                                {passwordForm.formState.errors.current_password && (
                                    <p className="text-sm text-destructive">
                                        {passwordForm.formState.errors.current_password.message}
                                    </p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="password">Nova Senha</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    placeholder="••••••••"
                                    {...passwordForm.register("password")}
                                />
                                {passwordForm.formState.errors.password && (
                                    <p className="text-sm text-destructive">
                                        {passwordForm.formState.errors.password.message}
                                    </p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="password_confirmation">Confirmar Nova Senha</Label>
                                <Input
                                    id="password_confirmation"
                                    type="password"
                                    placeholder="••••••••"
                                    {...passwordForm.register("password_confirmation")}
                                />
                                {passwordForm.formState.errors.password_confirmation && (
                                    <p className="text-sm text-destructive">
                                        {passwordForm.formState.errors.password_confirmation.message}
                                    </p>
                                )}
                            </div>

                            <div className="flex justify-end gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setPasswordDialogOpen(false)}
                                >
                                    Cancelar
                                </Button>
                                <Button type="submit" disabled={submittingPassword}>
                                    {submittingPassword ? "Alterando..." : "Alterar"}
                                </Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    );
}
