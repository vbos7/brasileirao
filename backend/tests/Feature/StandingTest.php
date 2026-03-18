<?php

use App\Models\{Game, Team};

use function Pest\Laravel\getJson;

it('should return the standings table public', function () {
    $response = getJson('/api/standings');

    $response->assertOk();
});

it('should calculate points correctly for a win', function () {
    // factory retorna Corinthians primeiro, São Paulo segundo
    $cor = Team::factory()->create();
    $sao = Team::factory()->create();

    Game::factory()->create([
        'home_team_id' => $cor->id,
        'away_team_id' => $sao->id,
        'home_score'   => 2,
        'away_score'   => 0,
        'status'       => 'realizado',
    ]);

    $standings = getJson('/api/standings')->json();

    $corRow = collect($standings)->firstWhere('team', $cor->name);
    $saoRow = collect($standings)->firstWhere('team', $sao->name);

    expect($corRow['points'])->toBe(3)
        ->and($corRow['wins'])->toBe(1)
        ->and($corRow['draws'])->toBe(0)
        ->and($corRow['losses'])->toBe(0)
        ->and($corRow['goals_for'])->toBe(2)
        ->and($corRow['goals_against'])->toBe(0)
        ->and($corRow['goal_difference'])->toBe(2)
        ->and($saoRow['points'])->toBe(0)
        ->and($saoRow['losses'])->toBe(1);
});

it('should calculate points correctly for a draw', function () {
    $cor = Team::factory()->create();
    $sao = Team::factory()->create();

    Game::factory()->create([
        'home_team_id' => $cor->id,
        'away_team_id' => $sao->id,
        'home_score'   => 1,
        'away_score'   => 1,
        'status'       => 'realizado',
    ]);

    $standings = getJson('/api/standings')->json();

    $corRow = collect($standings)->firstWhere('team', $cor->name);
    $saoRow = collect($standings)->firstWhere('team', $sao->name);

    expect($corRow['points'])->toBe(1)
        ->and($corRow['draws'])->toBe(1)
        ->and($saoRow['points'])->toBe(1)
        ->and($saoRow['draws'])->toBe(1);
});

it('should not count pending games in standings', function () {
    $cor = Team::factory()->create();
    $sao = Team::factory()->create();

    Game::factory()->create([
        'home_team_id' => $cor->id,
        'away_team_id' => $sao->id,
        'status'       => 'pendente',
    ]);

    $standings = getJson('/api/standings')->json();

    expect($standings)->toBeEmpty();
});

it('should sort by points then goal difference then goals for', function () {
    $cor = Team::factory()->create(); // Corinthians
    $sao = Team::factory()->create(); // São Paulo
    $pal = Team::factory()->create(); // Palmeiras

    // Corinthians 3 pontos, saldo +2, gols pró 3
    Game::factory()->create([
        'home_team_id' => $cor->id,
        'away_team_id' => $sao->id,
        'home_score'   => 3,
        'away_score'   => 1,
        'status'       => 'realizado',
    ]);

    // Palmeiras 3 pontos, saldo +2, gols pró 2
    Game::factory()->create([
        'home_team_id' => $pal->id,
        'away_team_id' => $sao->id,
        'home_score'   => 2,
        'away_score'   => 0,
        'status'       => 'realizado',
    ]);

    $standings = getJson('/api/standings')->json();

    // mesmos pontos, mesmo saldo — desempate por gols pró
    expect($standings[0]['team'])->toBe($cor->name)
        ->and($standings[1]['team'])->toBe($pal->name)
        ->and($standings[2]['team'])->toBe($sao->name);
});

it('should return all required columns', function () {
    $home = Team::factory()->create();
    $away = Team::factory()->create();

    Game::factory()->create([
        'home_team_id' => $home->id,
        'away_team_id' => $away->id,
        'home_score'   => 1,
        'away_score'   => 0,
        'status'       => 'realizado',
    ]);

    $standings = getJson('/api/standings')->json();

    expect($standings[0])->toHaveKeys([
        'team',
        'points',
        'games',
        'wins',
        'draws',
        'losses',
        'goals_for',
        'goals_against',
        'goal_difference',
    ]);
});
