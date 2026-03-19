"use client";

import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import api from "@/lib/api";
import { Team } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

const teamSchema = z.object({
    name: z.string().min(1, "Nome obrigatório"),
    short_name: z.string().max(5, "Máximo 5 caracteres").optional().or(z.literal("")),
});

type TeamForm = z.infer<typeof teamSchema>;

export default function TeamsPage() {
    const [teams, setTeams] = useState<Team[]>([]);
    const [loading, setLoading] = useState(true);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editing, setEditing] = useState<Team | null>(null);
    const [submitting, setSubmitting] = useState(false);

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<TeamForm>({
        resolver: zodResolver(teamSchema),
    });

    const fetchTeams = useCallback(async () => {
        try {
            const response = await api.get("/admin/teams");
            setTeams(response.data);
        } catch {
            toast.error("Erro ao carregar times.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchTeams();
    }, [fetchTeams]);

    function openCreate() {
        setEditing(null);
        reset({ name: "", short_name: "" });
        setDialogOpen(true);
    }

    function openEdit(team: Team) {
        setEditing(team);
        reset({ name: team.name, short_name: team.short_name || "" });
        setDialogOpen(true);
    }

    async function onSubmit(data: TeamForm) {
        setSubmitting(true);
        try {
            if (editing) {
                await api.put(`/admin/teams/${editing.id}`, data);
                toast.success("Time atualizado.");
            } else {
                await api.post("/admin/teams", data);
                toast.success("Time criado.");
            }
            setDialogOpen(false);
            fetchTeams();
        } catch (error) {
            const err = error as { message?: string };
            toast.error(err.message || "Erro ao salvar time.");
        } finally {
            setSubmitting(false);
        }
    }

    async function handleDelete(team: Team) {
        if (!confirm(`Excluir "${team.name}"?`)) return;

        try {
            await api.delete(`/admin/teams/${team.id}`);
            toast.success("Time excluído.");
            fetchTeams();
        } catch (error) {
            const err = error as { message?: string };
            toast.error(err.message || "Erro ao excluir time.");
        }
    }

    return (
        <div className="min-h-screen bg-background p-4 md:p-8">
            <div className="mx-auto max-w-5xl">
                <div className="flex items-center justify-between mb-6">
                    <h1 className="text-2xl font-bold">Times</h1>
                    <Button onClick={openCreate}>Novo Time</Button>
                </div>

                {loading ? (
                    <p className="text-muted-foreground">Carregando...</p>
                ) : teams.length === 0 ? (
                    <p className="text-muted-foreground">Nenhum time cadastrado.</p>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Nome</TableHead>
                                <TableHead>Sigla</TableHead>
                                <TableHead className="text-right">Ações</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {teams.map((team) => (
                                <TableRow key={team.id}>
                                    <TableCell className="font-medium">{team.name}</TableCell>
                                    <TableCell>{team.short_name}</TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => openEdit(team)}
                                            >
                                                Editar
                                            </Button>
                                            <Button
                                                variant="destructive"
                                                size="sm"
                                                onClick={() => handleDelete(team)}
                                            >
                                                Excluir
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}

                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>
                                {editing ? "Editar Time" : "Novo Time"}
                            </DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Nome</Label>
                                <Input id="name" placeholder="Ex: Flamengo" {...register("name")} />
                                {errors.name && (
                                    <p className="text-sm text-destructive">{errors.name.message}</p>
                                )}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="short_name">Sigla</Label>
                                <Input
                                    id="short_name"
                                    placeholder="Ex: FLA"
                                    maxLength={5}
                                    {...register("short_name")}
                                />
                                {errors.short_name && (
                                    <p className="text-sm text-destructive">
                                        {errors.short_name.message}
                                    </p>
                                )}
                            </div>
                            <div className="flex justify-end gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setDialogOpen(false)}
                                >
                                    Cancelar
                                </Button>
                                <Button type="submit" disabled={submitting}>
                                    {submitting ? "Salvando..." : "Salvar"}
                                </Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    );
}