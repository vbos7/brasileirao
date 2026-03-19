"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import api from "@/lib/api";
import { Standing } from "@/types";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function StandingsTable() {
    const [standings, setStandings] = useState<Standing[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get("/standings")
            .then((res) => setStandings(res.data))
            .catch(() => toast.error("Erro ao carregar classificação."))
            .finally(() => setLoading(false));
    }, []);

    return (
        <div className="min-h-screen bg-background p-4 md:p-8">
            <div className="mx-auto max-w-5xl">
                <Card>
                    <CardHeader className="px-4 md:px-6">
                        <CardTitle className="text-xl md:text-2xl font-bold">
                            Campeonato Brasileiro Série A
                        </CardTitle>
                        <p className="text-sm text-muted-foreground">Tabela de classificação</p>
                    </CardHeader>
                    <CardContent className="px-0 md:px-6">
                        {loading ? (
                            <p className="text-center py-8 text-muted-foreground">Carregando...</p>
                        ) : standings.length === 0 ? (
                            <p className="text-center py-8 text-muted-foreground">Nenhum jogo realizado ainda.</p>
                        ) : (
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-10 text-center">#</TableHead>
                                            <TableHead>Time</TableHead>
                                            <TableHead className="text-center font-semibold">P</TableHead>
                                            <TableHead className="text-center">J</TableHead>
                                            <TableHead className="text-center hidden sm:table-cell">V</TableHead>
                                            <TableHead className="text-center hidden sm:table-cell">E</TableHead>
                                            <TableHead className="text-center hidden sm:table-cell">D</TableHead>
                                            <TableHead className="text-center hidden md:table-cell">GP</TableHead>
                                            <TableHead className="text-center hidden md:table-cell">GC</TableHead>
                                            <TableHead className="text-center hidden md:table-cell">SG</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {standings.map((team, index) => (
                                            <TableRow key={team.team}>
                                                <TableCell className="text-center font-medium">
                                                    {index < 4 ? (
                                                        <Badge variant="default">{index + 1}</Badge>
                                                    ) : index >= standings.length - 4 ? (
                                                        <Badge variant="destructive">{index + 1}</Badge>
                                                    ) : (
                                                        index + 1
                                                    )}
                                                </TableCell>
                                                <TableCell className="font-medium">{team.team}</TableCell>
                                                <TableCell className="text-center font-bold">{team.points}</TableCell>
                                                <TableCell className="text-center">{team.games}</TableCell>
                                                <TableCell className="text-center hidden sm:table-cell">{team.wins}</TableCell>
                                                <TableCell className="text-center hidden sm:table-cell">{team.draws}</TableCell>
                                                <TableCell className="text-center hidden sm:table-cell">{team.losses}</TableCell>
                                                <TableCell className="text-center hidden md:table-cell">{team.goals_for}</TableCell>
                                                <TableCell className="text-center hidden md:table-cell">{team.goals_against}</TableCell>
                                                <TableCell className="text-center hidden md:table-cell">{team.goal_difference}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
