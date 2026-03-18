<?php

namespace Database\Factories;

use App\Models\{Game, Team};
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Game>
 */
class GameFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'home_team_id' => Team::factory(),
            'away_team_id' => Team::factory(),
            'game_date'    => now()->addDays(fake()->numberBetween(1, 30)),
            'status'       => 'pendente',
            'home_score'   => null,
            'away_score'   => null,
        ];
    }
}
