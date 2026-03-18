<?php

namespace Database\Seeders;

use App\Models\{Game, Team, User};
use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Collection;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->createUsers();
        Team::factory()->count(20)->create();
        $this->createGames();
    }

    private function createUsers(): void
    {
        User::factory()->create([
            'name'  => 'Admin',
            'email' => 'admin@brasileirao.com',
            'role'  => 'admin',
        ]);

        User::factory()->create([
            'name'  => 'Usuário',
            'email' => 'user@brasileirao.com',
        ]);
    }

    private function createGames(): void
    {
        $teams = Team::all();

        $this->createRound($teams, 'realizado', now()->subDays(14));
        $this->createRound($teams, 'realizado', now()->subDays(7));
        $this->createRound($teams, 'pendente', now()->addDays(7));
    }

    private function createRound(Collection $teams, string $status, Carbon $baseDate): void
    {
        $shuffled = $teams->shuffle();

        for ($i = 0; $i < $shuffled->count(); $i += 2) {
            $data = [
                'home_team_id' => $shuffled[$i]->id,
                'away_team_id' => $shuffled[$i + 1]->id,
                'status'       => $status,
                'game_date'    => $baseDate->copy()->addHours(rand(0, 8)),
            ];

            // placar só faz sentido para jogos realizados
            if ($status === 'realizado') {
                [$homeScore, $awayScore] = $this->randomScore();
                $data['home_score']      = $homeScore;
                $data['away_score']      = $awayScore;
            }

            Game::create($data);
        }
    }

    private function randomScore(): array
    {
        return [rand(0, 4), rand(0, 3)];
    }
}
