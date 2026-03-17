<?php

namespace Database\Factories;

use App\Models\Team;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Team>
 */
class TeamFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        static $teams = [
            ['name' => 'Corinthians',    'short_name' => 'COR'],
            ['name' => 'São Paulo',       'short_name' => 'SAO'],
            ['name' => 'Palmeiras',       'short_name' => 'PAL'],
            ['name' => 'Fluminense',      'short_name' => 'FLU'],
            ['name' => 'Bahia',           'short_name' => 'BAH'],
            ['name' => 'Flamengo',        'short_name' => 'FLA'],
            ['name' => 'Coritiba',        'short_name' => 'CFC'],
            ['name' => 'Grêmio',          'short_name' => 'GRE'],
            ['name' => 'RB Bragantino',   'short_name' => 'RBB'],
            ['name' => 'Athletico',       'short_name' => 'CAP'],
            ['name' => 'Vitória',         'short_name' => 'VIT'],
            ['name' => 'Chapecoense',     'short_name' => 'CHP'],
            ['name' => 'Mirassol',        'short_name' => 'MIR'],
            ['name' => 'Santos',          'short_name' => 'SAN'],
            ['name' => 'Vasco',           'short_name' => 'VAS'],
            ['name' => 'Atlético-MG',     'short_name' => 'CAM'],
            ['name' => 'Botafogo',        'short_name' => 'BOT'],
            ['name' => 'Remo',            'short_name' => 'REM'],
            ['name' => 'Cruzeiro',        'short_name' => 'CRU'],
            ['name' => 'Internacional',   'short_name' => 'INT'],
        ];

        // remove o time já utilizado para evitar duplicatas ao criar múltiplos
        $team = array_shift($teams);

        return $team;
    }
}
