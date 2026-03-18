<?php

use App\Models\{Game, Team, User};

use function Pest\Laravel\{actingAs, getJson};

it('standings should update immediately after score submission', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $cor   = Team::factory()->create();
    $sao   = Team::factory()->create();

    $game = Game::factory()->create([
        'home_team_id' => $cor->id,
        'away_team_id' => $sao->id,
        'status'       => 'pendente',
    ]);

    // antes do placar, classificação deve estar vazia
    getJson('/api/standings')->assertOk()->assertJsonCount(0);

    // lançar placar
    actingAs($admin)->patchJson("/api/admin/games/{$game->id}/score", [
        'home_score' => 3,
        'away_score' => 1,
    ])->assertOk();

    // classificação deve refletir imediatamente
    $standings = getJson('/api/standings')->json();

    $corRow = collect($standings)->firstWhere('team', $cor->name);
    $saoRow = collect($standings)->firstWhere('team', $sao->name);

    expect($corRow['points'])->toBe(3)
        ->and($corRow['games'])->toBe(1)
        ->and($corRow['wins'])->toBe(1)
        ->and($corRow['goals_for'])->toBe(3)
        ->and($corRow['goals_against'])->toBe(1)
        ->and($saoRow['points'])->toBe(0)
        ->and($saoRow['games'])->toBe(1)
        ->and($saoRow['losses'])->toBe(1);
});

it('standings should handle multiple games correctly', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $cor   = Team::factory()->create();
    $sao   = Team::factory()->create();
    $pal   = Team::factory()->create();

    $game1 = Game::factory()->create([
        'home_team_id' => $cor->id,
        'away_team_id' => $sao->id,
        'status'       => 'pendente',
    ]);

    $game2 = Game::factory()->create([
        'home_team_id' => $cor->id,
        'away_team_id' => $pal->id,
        'status'       => 'pendente',
    ]);

    // Corinthians 2x0 São Paulo → 3 pts para o Corinthians
    actingAs($admin)->patchJson("/api/admin/games/{$game1->id}/score", [
        'home_score' => 2,
        'away_score' => 0,
    ]);

    // Corinthians 1x1 Palmeiras → 1 pt cada
    actingAs($admin)->patchJson("/api/admin/games/{$game2->id}/score", [
        'home_score' => 1,
        'away_score' => 1,
    ]);

    $standings = getJson('/api/standings')->json();

    $corRow = collect($standings)->firstWhere('team', $cor->name);
    $palRow = collect($standings)->firstWhere('team', $pal->name);
    $saoRow = collect($standings)->firstWhere('team', $sao->name);

    // Corinthians: 4 pts, 2 jogos, 1V 1E 0D, 3GP 1GC
    expect($corRow['points'])->toBe(4)
        ->and($corRow['games'])->toBe(2)
        ->and($corRow['wins'])->toBe(1)
        ->and($corRow['draws'])->toBe(1)
        ->and($corRow['goals_for'])->toBe(3)
        ->and($corRow['goals_against'])->toBe(1);

    // Palmeiras: 1 pt, 1 jogo
    expect($palRow['points'])->toBe(1)
        ->and($palRow['games'])->toBe(1);

    // São Paulo: 0 pts, 1 jogo
    expect($saoRow['points'])->toBe(0)
        ->and($saoRow['games'])->toBe(1);

    // ordem: Corinthians (4pts) > Palmeiras (1pt) > São Paulo (0pts)
    expect($standings[0]['team'])->toBe($cor->name)
        ->and($standings[1]['team'])->toBe($pal->name)
        ->and($standings[2]['team'])->toBe($sao->name);
});
