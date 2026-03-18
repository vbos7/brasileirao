<?php

namespace Database\Factories;

use App\Models\Team;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Team>
 */
class TeamFactory extends Factory
{
    public function definition(): array
    {
        // carrega a lista oficial do Brasileirão a partir do arquivo de dados
        // array_shift garante que cada chamada retorna um time diferente (sem duplicatas)
        // se a lista acabar, usa faker para não quebrar testes que criam muitos times
        static $teams = null;

        if ($teams === null) {
            $json  = file_get_contents(database_path('data/brasileirao_teams.json'));
            $data  = json_decode($json, true);
            $teams = $data['teams'];

            // Corinthians sempre primeiro — testes dependem dessa ordem
            usort($teams, fn ($a, $b) => $a['name'] === 'Corinthians' ? -1 : ($b['name'] === 'Corinthians' ? 1 : 0));
        }

        if (!empty($teams)) {
            return array_shift($teams);
        }

        return [
            'name'       => fake()->unique()->city() . ' FC',
            'short_name' => strtoupper(fake()->lexify('???')),
        ];
    }
}
