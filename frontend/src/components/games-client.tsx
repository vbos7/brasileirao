"use client";

import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import api from "@/lib/api";
import { Game, Team } from "@/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
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
import {
    Pagination,
    PaginationContent,
    PaginationEllipsis,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "@/components/ui/pagination";

const gameSchema = z
    .object({
        home_team_id: z.string().min(1, "Selecione o time da casa"),
        away_team_id: z.string().min(1, "Selecione o visitante"),
    })
    .refine((data) => data.home_team_id !== data.away_team_id, {
        message: "Times devem ser diferentes",
        path: ["away_team_id"],
    });

type GameForm = z.infer<typeof gameSchema>;

const scoreSchema = z.object({
    home_score: z.number().min(0, "Mínimo 0"),
    away_score: z.number().min(0, "Mínimo 0"),
});

type ScoreForm = z.infer<typeof scoreSchema>;

function buildPageNumbers(current: number, total: number): (number | "...")[] {
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
    if (current <= 4) return [1, 2, 3, 4, 5, "...", total];
    if (current >= total - 3) return [1, "...", total - 4, total - 3, total - 2, total - 1, total];
    return [1, "...", current - 1, current, current + 1, "...", total];
}

export function GamesClient() {
    const [games, setGames] = useState<Game[]>([]);
    const [teams, setTeams] = useState<Team[]>([]);
    const [loading, setLoading] = useState(true);
    const [meta, setMeta] = useState({ current_page: 1, last_page: 1 });

    // Filtros
    const [filterTeam, setFilterTeam] = useState("");
    const [filterDateFrom, setFilterDateFrom] = useState<Date | undefined>();
    const [filterDateTo, setFilterDateTo] = useState<Date | undefined>();

    // Dialogs
    const [createOpen, setCreateOpen] = useState(false);
    const [scoreOpen, setScoreOpen] = useState(false);
    const [scoringGame, setScoringGame] = useState<Game | null>(null);
    const [submitting, setSubmitting] = useState(false);

    // Date picker para criação
    const [gameDate, setGameDate] = useState<Date | undefined>();
    const [gameTime, setGameTime] = useState("12:00");
    const [gameDateError, setGameDateError] = useState("");

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

    function currentFilters() {
        return {
            team: filterTeam,
            dateFrom: filterDateFrom ? format(filterDateFrom, "yyyy-MM-dd") : undefined,
            dateTo: filterDateTo ? format(filterDateTo, "yyyy-MM-dd") : undefined,
        };
    }

    function handleFilter() {
        fetchGames(1, currentFilters());
    }

    function clearFilters() {
        setFilterTeam("");
        setFilterDateFrom(undefined);
        setFilterDateTo(undefined);
        fetchGames(1);
    }

    function openCreate() {
        gameForm.reset({ home_team_id: "", away_team_id: "" });
        setGameDate(undefined);
        setGameTime("12:00");
        setGameDateError("");
        setCreateOpen(true);
    }

    async function onCreateSubmit(data: GameForm) {
        if (!gameDate) {
            setGameDateError("Selecione a data do jogo");
            return;
        }
        setGameDateError("");
        setSubmitting(true);
        try {
            const dateStr = format(gameDate, "yyyy-MM-dd") + "T" + gameTime + ":00";
            await api.post("/admin/games", {
                home_team_id: Number(data.home_team_id),
                away_team_id: Number(data.away_team_id),
                game_date: dateStr,
            });
            toast.success("Jogo criado.");
            setCreateOpen(false);
            fetchGames(meta.current_page, currentFilters());
        } catch (error) {
            const err = error as { message?: string };
            toast.error(err.message || "Erro ao criar jogo.");
        } finally {
            setSubmitting(false);
        }
    }

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
            fetchGames(meta.current_page, currentFilters());
        } catch (error) {
            const err = error as { message?: string };
            toast.error(err.message || "Erro ao lançar placar.");
        } finally {
            setSubmitting(false);
        }
    }

    async function handleDelete(game: Game) {
        if (!confirm("Excluir este jogo?")) return;
        try {
            await api.delete(`/admin/games/${game.id}`);
            toast.success("Jogo excluído.");
            fetchGames(meta.current_page, currentFilters());
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

    function goToPage(page: number) {
        if (page < 1 || page > meta.last_page) return;
        fetchGames(page, currentFilters());
    }

    const pageNumbers = buildPageNumbers(meta.current_page, meta.last_page);

    return (
        <div className="min-h-screen bg-background p-4 md:p-8">
            <div className="mx-auto max-w-5xl">
                <div className="flex items-center justify-between mb-6">
                    <h1 className="text-xl md:text-2xl font-bold">Jogos</h1>
                    <Button onClick={openCreate}>Novo Jogo</Button>
                </div>

                {/* Filtros */}
                <div className="flex flex-col sm:flex-row flex-wrap gap-3 mb-6">
                    <Input
                        placeholder="Filtrar por time..."
                        value={filterTeam}
                        onChange={(e) => setFilterTeam(e.target.value)}
                        className="w-full sm:w-48"
                    />

                    {/* Date picker: De */}
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline"
                                className={cn(
                                    "w-full sm:w-44 justify-start text-left font-normal",
                                    !filterDateFrom && "text-muted-foreground",
                                )}
                            >
                                <CalendarIcon className="mr-2 size-4" />
                                {filterDateFrom
                                    ? format(filterDateFrom, "dd/MM/yyyy", { locale: ptBR })
                                    : "De"}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                                mode="single"
                                selected={filterDateFrom}
                                onSelect={setFilterDateFrom}
                                locale={ptBR}
                            />
                        </PopoverContent>
                    </Popover>

                    {/* Date picker: Até */}
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline"
                                className={cn(
                                    "w-full sm:w-44 justify-start text-left font-normal",
                                    !filterDateTo && "text-muted-foreground",
                                )}
                            >
                                <CalendarIcon className="mr-2 size-4" />
                                {filterDateTo
                                    ? format(filterDateTo, "dd/MM/yyyy", { locale: ptBR })
                                    : "Até"}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                                mode="single"
                                selected={filterDateTo}
                                onSelect={setFilterDateTo}
                                locale={ptBR}
                            />
                        </PopoverContent>
                    </Popover>

                    <div className="flex gap-2">
                        <Button onClick={handleFilter} variant="secondary" className="flex-1 sm:flex-none">
                            Filtrar
                        </Button>
                        <Button onClick={clearFilters} variant="outline" className="flex-1 sm:flex-none">
                            Limpar
                        </Button>
                    </div>
                </div>

                {/* Tabela */}
                {loading ? (
                    <p className="text-muted-foreground">Carregando...</p>
                ) : games.length === 0 ? (
                    <p className="text-muted-foreground">Nenhum jogo encontrado.</p>
                ) : (
                    <>
                        <div className="overflow-x-auto rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Casa</TableHead>
                                        <TableHead className="text-center">Placar</TableHead>
                                        <TableHead>Visitante</TableHead>
                                        <TableHead className="hidden sm:table-cell">Data</TableHead>
                                        <TableHead className="hidden sm:table-cell">Status</TableHead>
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
                                            <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">
                                                {formatDate(game.game_date)}
                                            </TableCell>
                                            <TableCell className="hidden sm:table-cell">
                                                <Badge
                                                    variant={game.status === "realizado" ? "default" : "secondary"}
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
                        </div>

                        {/* Paginação */}
                        {meta.last_page > 1 && (
                            <div className="mt-4">
                                <Pagination>
                                    <PaginationContent>
                                        <PaginationItem>
                                            <PaginationPrevious
                                                href="#"
                                                onClick={(e) => { e.preventDefault(); goToPage(meta.current_page - 1); }}
                                                className={meta.current_page <= 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                                            />
                                        </PaginationItem>

                                        {pageNumbers.map((p, i) =>
                                            p === "..." ? (
                                                <PaginationItem key={`ellipsis-${i}`}>
                                                    <PaginationEllipsis />
                                                </PaginationItem>
                                            ) : (
                                                <PaginationItem key={p}>
                                                    <PaginationLink
                                                        href="#"
                                                        isActive={p === meta.current_page}
                                                        onClick={(e) => { e.preventDefault(); goToPage(p as number); }}
                                                        className="cursor-pointer"
                                                    >
                                                        {p}
                                                    </PaginationLink>
                                                </PaginationItem>
                                            )
                                        )}

                                        <PaginationItem>
                                            <PaginationNext
                                                href="#"
                                                onClick={(e) => { e.preventDefault(); goToPage(meta.current_page + 1); }}
                                                className={meta.current_page >= meta.last_page ? "pointer-events-none opacity-50" : "cursor-pointer"}
                                            />
                                        </PaginationItem>
                                    </PaginationContent>
                                </Pagination>
                            </div>
                        )}
                    </>
                )}

                {/* Dialog Criar Jogo */}
                <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                    <DialogContent className="w-[calc(100vw-2rem)] max-w-lg">
                        <DialogHeader>
                            <DialogTitle>Novo Jogo</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={gameForm.handleSubmit(onCreateSubmit)} className="space-y-4">
                            <div className="space-y-2">
                                <Label>Time da Casa</Label>
                                <Select onValueChange={(val) => gameForm.setValue("home_team_id", val)}>
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
                                <Select onValueChange={(val) => gameForm.setValue("away_team_id", val)}>
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

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Data</Label>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                className={cn(
                                                    "w-full justify-start text-left font-normal",
                                                    !gameDate && "text-muted-foreground",
                                                )}
                                            >
                                                <CalendarIcon className="mr-2 size-4" />
                                                {gameDate
                                                    ? format(gameDate, "dd/MM/yyyy", { locale: ptBR })
                                                    : "Selecione a data"}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0" align="start">
                                            <Calendar
                                                mode="single"
                                                selected={gameDate}
                                                onSelect={(d) => {
                                                    setGameDate(d);
                                                    if (d) setGameDateError("");
                                                }}
                                                locale={ptBR}
                                            />
                                        </PopoverContent>
                                    </Popover>
                                    {gameDateError && (
                                        <p className="text-sm text-destructive">{gameDateError}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label>Horário</Label>
                                    <Input
                                        type="time"
                                        value={gameTime}
                                        onChange={(e) => setGameTime(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="flex flex-col-reverse sm:flex-row justify-end gap-2">
                                <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>
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
                    <DialogContent className="w-[calc(100vw-2rem)] max-w-sm">
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
                        <form onSubmit={scoreForm.handleSubmit(onScoreSubmit)} className="space-y-4">
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

                            <div className="flex flex-col-reverse sm:flex-row justify-end gap-2">
                                <Button type="button" variant="outline" onClick={() => setScoreOpen(false)}>
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
