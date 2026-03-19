"use client";

import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import api from "@/lib/api";
import { Game, Team } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

// Schema criar jogo
const gameSchema = z
    .object({
        home_team_id: z.string().min(1, "Selecione o time da casa"),
        away_team_id: z.string().min(1, "Selecione o visitante"),
        game_date: z.string().min(1, "Data obrigatória"),
    })
    .refine((data) => data.home_team_id !== data.away_team_id, {
        message: "Times devem ser diferentes",
        path: ["away_team_id"],
    });

type GameForm = z.infer<typeof gameSchema>;

// Schema lançar placar
const scoreSchema = z.object({
    home_score: z.number().min(0, "Mínimo 0"),
    away_score: z.number().min(0, "Mínimo 0"),
});

type ScoreForm = z.infer<typeof scoreSchema>;

export default function GamesPage() {
    const [games, setGames] = useState<Game[]>([]);
    const [teams, setTeams] = useState<Team[]>([]);
    const [loading, setLoading] = useState(true);
    const [meta, setMeta] = useState({ current_page: 1, last_page: 1 });

    // Filtros
    const [filterTeam, setFilterTeam] = useState("");
    const [filterDateFrom, setFilterDateFrom] = useState("");
    const [filterDateTo, setFilterDateTo] = useState("");

    // Dialogs
    const [createOpen, setCreateOpen] = useState(false);
    const [scoreOpen, setScoreOpen] = useState(false);
    const [scoringGame, setScoringGame] = useState<Game | null>(null);
    const [submitting, setSubmitting] = useState(false);

    const gameForm = useForm<GameForm>({
        resolver: zodResolver(gameSchema),
    });

    const scoreForm = useForm<ScoreForm>({
        resolver: zodResolver(scoreSchema),
    });

    const fetchGames = useCallback(async (
        page = 1,
        filters: { team?: string; dateFrom?: string; dateTo?: string } = {},
    ) => {
        setLoading(true);
        try {
            const params: Record<string, string> = { page: String(page) };
            if (filters.team) params.team = filters.team;
            if (filters.dateFrom) params.date_from = filters.dateFrom;
            if (filters.dateTo) params.date_to = filters.dateTo;

            const response = await api.get("/admin/games", { params });
            setGames(response.data.data);
            setMeta(response.data.meta);
        } catch {
            toast.error("Erro ao carregar jogos.");
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchTeams = useCallback(async () => {
        try {
            const response = await api.get("/admin/teams");
            setTeams(response.data);
        } catch {
            toast.error("Erro ao carregar times.");
        }
    }, []);

    useEffect(() => {
        fetchGames();
        fetchTeams();
    }, [fetchGames, fetchTeams]);

    function handleFilter() {
        fetchGames(1, { team: filterTeam, dateFrom: filterDateFrom, dateTo: filterDateTo });
    }

    function clearFilters() {
        setFilterTeam("");
        setFilterDateFrom("");
        setFilterDateTo("");
        fetchGames(1);
    }

    // Criar jogo
    function openCreate() {
        gameForm.reset({ home_team_id: "", away_team_id: "", game_date: "" });
        setCreateOpen(true);
    }

    async function onCreateSubmit(data: GameForm) {
        setSubmitting(true);
        try {
            await api.post("/admin/games", {
                home_team_id: Number(data.home_team_id),
                away_team_id: Number(data.away_team_id),
                game_date: data.game_date,
            });
            toast.success("Jogo criado.");
            setCreateOpen(false);
            fetchGames(meta.current_page, { team: filterTeam, dateFrom: filterDateFrom, dateTo: filterDateTo });
        } catch (error) {
            const err = error as { message?: string };
            toast.error(err.message || "Erro ao criar jogo.");
        } finally {
            setSubmitting(false);
        }
    }

    // Lançar placar
    function openScore(game: Game) {
        setScoringGame(game);
        scoreForm.reset({ home_score: 0, away_score: 0 });
        setScoreOpen(true);
    }

    async function onScoreSubmit(data: ScoreForm) {
        if (!scoringGame) return;
        setSubmitting(true);
        try {
            await api.patch(`/admin/games/${scoringGame.id}/score`, data);
            toast.success("Placar lançado.");
            setScoreOpen(false);
            fetchGames(meta.current_page, { team: filterTeam, dateFrom: filterDateFrom, dateTo: filterDateTo });
        } catch (error) {
            const err = error as { message?: string };
            toast.error(err.message || "Erro ao lançar placar.");
        } finally {
            setSubmitting(false);
        }
    }

    // Excluir
    async function handleDelete(game: Game) {
        if (!confirm("Excluir este jogo?")) return;
        try {
            await api.delete(`/admin/games/${game.id}`);
            toast.success("Jogo excluído.");
            fetchGames(meta.current_page, { team: filterTeam, dateFrom: filterDateFrom, dateTo: filterDateTo });
        } catch (error) {
            const err = error as { message?: string };
            toast.error(err.message || "Erro ao excluir jogo.");
        }
    }

    function formatDate(dateStr: string) {
        return new Date(dateStr).toLocaleDateString("pt-BR", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    }

    return (
        <div className="min-h-screen bg-background p-4 md:p-8">
            <div className="mx-auto max-w-5xl">
                <div className="flex items-center justify-between mb-6">
                    <h1 className="text-2xl font-bold">Jogos</h1>
                    <Button onClick={openCreate}>Novo Jogo</Button>
                </div>

                {/* Filtros */}
                <div className="flex flex-wrap gap-3 mb-6">
                    <Input
                        placeholder="Filtrar por time..."
                        value={filterTeam}
                        onChange={(e) => setFilterTeam(e.target.value)}
                        className="w-48"
                    />
                    <Input
                        type="date"
                        value={filterDateFrom}
                        onChange={(e) => setFilterDateFrom(e.target.value)}
                        className="w-40"
                    />
                    <Input
                        type="date"
                        value={filterDateTo}
                        onChange={(e) => setFilterDateTo(e.target.value)}
                        className="w-40"
                    />
                    <Button onClick={handleFilter} variant="secondary">
                        Filtrar
                    </Button>
                    <Button onClick={clearFilters} variant="outline">
                        Limpar
                    </Button>
                </div>

                {/* Tabela */}
                {loading ? (
                    <p className="text-muted-foreground">Carregando...</p>
                ) : games.length === 0 ? (
                    <p className="text-muted-foreground">Nenhum jogo encontrado.</p>
                ) : (
                    <>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Casa</TableHead>
                                    <TableHead className="text-center">Placar</TableHead>
                                    <TableHead>Visitante</TableHead>
                                    <TableHead>Data</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Ações</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {games.map((game) => (
                                    <TableRow key={game.id}>
                                        <TableCell className="font-medium">
                                            {game.home_team.name}
                                        </TableCell>
                                        <TableCell className="text-center font-bold">
                                            {game.status === "realizado"
                                                ? `${game.home_score} x ${game.away_score}`
                                                : "- x -"}
                                        </TableCell>
                                        <TableCell className="font-medium">
                                            {game.away_team.name}
                                        </TableCell>
                                        <TableCell>{formatDate(game.game_date)}</TableCell>
                                        <TableCell>
                                            <Badge
                                                variant={
                                                    game.status === "realizado" ? "default" : "secondary"
                                                }
                                            >
                                                {game.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                {game.status === "pendente" && (
                                                    <Button
                                                        size="sm"
                                                        onClick={() => openScore(game)}
                                                    >
                                                        Placar
                                                    </Button>
                                                )}
                                                <Button
                                                    variant="destructive"
                                                    size="sm"
                                                    onClick={() => handleDelete(game)}
                                                >
                                                    Excluir
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>

                        {/* Paginação */}
                        <div className="flex items-center justify-center gap-2 mt-4">
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={meta.current_page <= 1}
                                onClick={() => fetchGames(meta.current_page - 1, { team: filterTeam, dateFrom: filterDateFrom, dateTo: filterDateTo })}
                            >
                                Anterior
                            </Button>
                            <span className="text-sm text-muted-foreground">
                                {meta.current_page} de {meta.last_page}
                            </span>
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={meta.current_page >= meta.last_page}
                                onClick={() => fetchGames(meta.current_page + 1, { team: filterTeam, dateFrom: filterDateFrom, dateTo: filterDateTo })}
                            >
                                Próxima
                            </Button>
                        </div>
                    </>
                )}

                {/* Dialog Criar Jogo */}
                <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Novo Jogo</DialogTitle>
                        </DialogHeader>
                        <form
                            onSubmit={gameForm.handleSubmit(onCreateSubmit)}
                            className="space-y-4"
                        >
                            <div className="space-y-2">
                                <Label>Time da Casa</Label>
                                <Select
                                    onValueChange={(val: string) => gameForm.setValue("home_team_id", val)}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecione..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {teams.map((team) => (
                                            <SelectItem key={team.id} value={String(team.id)}>
                                                {team.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {gameForm.formState.errors.home_team_id && (
                                    <p className="text-sm text-destructive">
                                        {gameForm.formState.errors.home_team_id.message}
                                    </p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label>Time Visitante</Label>
                                <Select
                                    onValueChange={(val: string) => gameForm.setValue("away_team_id", val)}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecione..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {teams.map((team) => (
                                            <SelectItem key={team.id} value={String(team.id)}>
                                                {team.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {gameForm.formState.errors.away_team_id && (
                                    <p className="text-sm text-destructive">
                                        {gameForm.formState.errors.away_team_id.message}
                                    </p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label>Data do Jogo</Label>
                                <Input
                                    type="datetime-local"
                                    {...gameForm.register("game_date")}
                                />
                                {gameForm.formState.errors.game_date && (
                                    <p className="text-sm text-destructive">
                                        {gameForm.formState.errors.game_date.message}
                                    </p>
                                )}
                            </div>

                            <div className="flex justify-end gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setCreateOpen(false)}
                                >
                                    Cancelar
                                </Button>
                                <Button type="submit" disabled={submitting}>
                                    {submitting ? "Criando..." : "Criar"}
                                </Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* Dialog Lançar Placar */}
                <Dialog open={scoreOpen} onOpenChange={setScoreOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>
                                Lançar Placar
                                {scoringGame && (
                                    <span className="block text-sm font-normal text-muted-foreground mt-1">
                                        {scoringGame.home_team.name} vs {scoringGame.away_team.name}
                                    </span>
                                )}
                            </DialogTitle>
                        </DialogHeader>
                        <form
                            onSubmit={scoreForm.handleSubmit(onScoreSubmit)}
                            className="space-y-4"
                        >
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>{scoringGame?.home_team.name}</Label>
                                    <Input
                                        type="number"
                                        min={0}
                                        {...scoreForm.register("home_score", { valueAsNumber: true })}
                                    />
                                    {scoreForm.formState.errors.home_score && (
                                        <p className="text-sm text-destructive">
                                            {scoreForm.formState.errors.home_score.message}
                                        </p>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <Label>{scoringGame?.away_team.name}</Label>
                                    <Input
                                        type="number"
                                        min={0}
                                        {...scoreForm.register("away_score", { valueAsNumber: true })}
                                    />
                                    {scoreForm.formState.errors.away_score && (
                                        <p className="text-sm text-destructive">
                                            {scoreForm.formState.errors.away_score.message}
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div className="flex justify-end gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setScoreOpen(false)}
                                >
                                    Cancelar
                                </Button>
                                <Button type="submit" disabled={submitting}>
                                    {submitting ? "Salvando..." : "Salvar Placar"}
                                </Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    );
}