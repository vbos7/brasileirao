<?php

use App\Models\{Team, User};

use function Pest\Laravel\{actingAs, assertDatabaseHas, assertDatabaseMissing};

it('admin should be able to create a team', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $team  = Team::factory()->make();

    $response = actingAs($admin)
        ->postJson('/api/admin/teams', [
            'name'       => $team->name,
            'short_name' => $team->short_name,
        ]);

    $response->assertStatus(201)
        ->assertJsonStructure(['id', 'name', 'short_name']);

    assertDatabaseHas('teams', ['name' => $team->name]);
});

it('should not create a team with duplicate name', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $team  = Team::factory()->create(['name' => 'Corinthians']);

    $response = actingAs($admin)
        ->postJson('/api/admin/teams', [
            'name'       => $team->name,
            'short_name' => $team->short_name,
        ]);

    $response->assertStatus(422);
});

it('user should not create a team', function () {
    $user = User::factory()->create();

    $response = actingAs($user)
        ->postJson('/api/admin/teams', [
            'name' => 'Corinthians',
        ]);

    $response->assertStatus(403);
});

it('admin should be able to list teams', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    Team::factory()->count(3)->create();

    $response = actingAs($admin)
        ->getJson('/api/admin/teams');

    $response->assertOk()
        ->assertJsonCount(3);
});

it('admin should be able to update a team', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $team  = Team::factory()->create();

    $response = actingAs($admin)
        ->putJson("/api/admin/teams/{$team->id}", [
            'name'       => $team->name,
            'short_name' => $team->short_name,
        ]);

    $response->assertOk();
    expect($team->fresh()->name)->toBe($team->name);
});

it('admin should be able to delete a team', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $team  = Team::factory()->create();

    $response = actingAs($admin)
        ->deleteJson("/api/admin/teams/{$team->id}");

    $response->assertOk();
    assertDatabaseMissing('teams', ['id' => $team->id]);
});

it('should return 404 for non-existent team', function () {
    $admin = User::factory()->create(['role' => 'admin']);

    $response = actingAs($admin)
        ->getJson('/api/admin/teams/999');

    $response->assertStatus(404)
        ->assertJson([
            'status'  => 'error',
            'message' => 'Time não encontrado.',
        ]);
});
