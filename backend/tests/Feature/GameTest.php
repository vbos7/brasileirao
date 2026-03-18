<?php

use App\Models\{Game, Team, User};

use function Pest\Laravel\{actingAs, assertDatabaseHas, assertDatabaseMissing};

it('admin should be able to create a game', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $home  = Team::factory()->create();
    $away  = Team::factory()->create();

    $response = actingAs($admin)
        ->postJson('/api/admin/games', [
            'home_team_id' => $home->id,
            'away_team_id' => $away->id,
            'game_date'    => now()->format('Y-m-d H:i:s'),
        ]);

    $response->assertStatus(201)
        ->assertJsonStructure(['id', 'home_team_id', 'away_team_id', 'status', 'game_date']);

    assertDatabaseHas('games', [
        'home_team_id' => $home->id,
        'away_team_id' => $away->id,
        'status'       => 'pendente',
    ]);
});

it('should not create a game with same team as home and away', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $team  = Team::factory()->create();

    $response = actingAs($admin)
        ->postJson('/api/admin/games', [
            'home_team_id' => $team->id,
            'away_team_id' => $team->id,
            'game_date'    => now()->format('Y-m-d H:i:s'),
        ]);

    $response->assertStatus(422);
});

it('admin should be able to submit a game score', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $game  = Game::factory()->create();

    $response = actingAs($admin)
        ->patchJson("/api/admin/games/{$game->id}/score", [
            'home_score' => 2,
            'away_score' => 1,
        ]);

    $response->assertOk();

    $game->refresh();
    expect($game->home_score)->toBe(2)
        ->and($game->away_score)->toBe(1)
        ->and($game->status)->toBe('realizado');
});

it('should not accept negative scores', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $game  = Game::factory()->create();

    $response = actingAs($admin)
        ->patchJson("/api/admin/games/{$game->id}/score", [
            'home_score' => -1,
            'away_score' => 0,
        ]);

    $response->assertStatus(422);
});

it('user should not submit a game score', function () {
    $user = User::factory()->create();
    $game = Game::factory()->create();

    $response = actingAs($user)
        ->patchJson("/api/admin/games/{$game->id}/score", [
            'home_score' => 1,
            'away_score' => 0,
        ]);

    $response->assertStatus(403);
});

it('admin should be able to delete a game realized in the last 3 days', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $game  = Game::factory()->create([
        'status'     => 'realizado',
        'updated_at' => now()->subDays(2),
    ]);

    $response = actingAs($admin)
        ->deleteJson("/api/admin/games/{$game->id}");

    $response->assertOk();
    assertDatabaseMissing('games', ['id' => $game->id]);
});

it('should not delete a game realized more than 3 days ago', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $game  = Game::factory()->create([
        'status'     => 'realizado',
        'updated_at' => now()->subDays(4),
    ]);

    $response = actingAs($admin)
        ->deleteJson("/api/admin/games/{$game->id}");

    $response->assertStatus(403);
});

it('should not delete a game with status pendente', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $game  = Game::factory()->create();

    $response = actingAs($admin)
        ->deleteJson("/api/admin/games/{$game->id}");

    $response->assertStatus(403);
});

it('admin should be able to list games with pagination', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    Game::factory()->count(20)->create();

    $response = actingAs($admin)
        ->getJson('/api/admin/games?page=1');

    $response->assertOk()
        ->assertJsonStructure([
            'data',
            'meta' => ['current_page', 'last_page', 'per_page', 'total'],
        ]);
});

it('should filter games by team name', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    // factory retorna Corinthians primeiro, São Paulo segundo, Palmeiras terceiro
    $cor = Team::factory()->create();
    $sao = Team::factory()->create();
    $pal = Team::factory()->create();

    Game::factory()->create(['home_team_id' => $cor->id, 'away_team_id' => $sao->id]);
    Game::factory()->create(['home_team_id' => $pal->id, 'away_team_id' => $sao->id]);

    $response = actingAs($admin)
        ->getJson('/api/admin/games?team=' . urlencode($cor->name));

    $response->assertOk();
    expect($response->json('data'))->toHaveCount(1);
});

it('should filter games by date range', function () {
    $admin = User::factory()->create(['role' => 'admin']);

    Game::factory()->create(['game_date' => '2026-05-10 16:00:00']);
    Game::factory()->create(['game_date' => '2026-06-15 16:00:00']);
    Game::factory()->create(['game_date' => '2026-07-20 16:00:00']);

    $response = actingAs($admin)
        ->getJson('/api/admin/games?date_from=2026-05-01&date_to=2026-06-30');

    $response->assertOk();
    expect($response->json('data'))->toHaveCount(2);
});
