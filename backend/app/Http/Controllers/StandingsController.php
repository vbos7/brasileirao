<?php

namespace App\Http\Controllers;

use App\Models\{Game};
use Illuminate\Http\JsonResponse;

class StandingsController extends Controller
{
    public function __invoke(): JsonResponse
    {
        // busca apenas jogos finalizados com os times relacionados
        $games = Game::with(['homeTeam', 'awayTeam'])
            ->where('status', 'realizado')
            ->get();

        // monta a tabela acumulando estatísticas por time
        $table = [];

        foreach ($games as $game) {
            $homeId = $game->home_team_id;
            $awayId = $game->away_team_id;

            if (!isset($table[$homeId])) {
                $table[$homeId] = $this->emptyRow($game->homeTeam->name);
            }

            if (!isset($table[$awayId])) {
                $table[$awayId] = $this->emptyRow($game->awayTeam->name);
            }

            $homeScore = $game->home_score;
            $awayScore = $game->away_score;

            $table[$homeId]['games']++;
            $table[$awayId]['games']++;
            $table[$homeId]['goals_for'] += $homeScore;
            $table[$homeId]['goals_against'] += $awayScore;
            $table[$awayId]['goals_for'] += $awayScore;
            $table[$awayId]['goals_against'] += $homeScore;

            if ($homeScore > $awayScore) {
                // vitória do time da casa
                $table[$homeId]['wins']++;
                $table[$homeId]['points'] += 3;
                $table[$awayId]['losses']++;
            } elseif ($homeScore < $awayScore) {
                // vitória do time visitante
                $table[$awayId]['wins']++;
                $table[$awayId]['points'] += 3;
                $table[$homeId]['losses']++;
            } else {
                // empate
                $table[$homeId]['draws']++;
                $table[$homeId]['points']++;
                $table[$awayId]['draws']++;
                $table[$awayId]['points']++;
            }
        }

        // calcula saldo de gols e ordena: pontos > saldo > gols pró
        $standings = collect($table)
            ->map(function (array $row) {
                $row['goal_difference'] = $row['goals_for'] - $row['goals_against'];

                return $row;
            })
            ->sortByDesc('goals_for')
            ->sortByDesc('goal_difference')
            ->sortByDesc('points')
            ->values();

        return response()->json($standings);
    }

    /** @return array{team: string, points: int, games: int, wins: int, draws: int, losses: int, goals_for: int, goals_against: int, goal_difference: int} */
    private function emptyRow(string $teamName): array
    {
        return [
            'team'            => $teamName,
            'points'          => 0,
            'games'           => 0,
            'wins'            => 0,
            'draws'           => 0,
            'losses'          => 0,
            'goals_for'       => 0,
            'goals_against'   => 0,
            'goal_difference' => 0,
        ];
    }
}
