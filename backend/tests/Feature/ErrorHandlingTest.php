<?php

use App\Models\User;

use function Pest\Laravel\{actingAs, getJson};

it('should return standardized error for unauthenticated access', function () {
    $response = getJson('/api/admin/teams');

    $response->assertStatus(401)
        ->assertJson([
            'status'  => 'error',
            'message' => 'Token inválido ou expirado.',
        ]);
});

it('should return standardized error for validation errors', function () {
    $admin = User::factory()->create(['role' => 'admin']);

    $response = actingAs($admin)
        ->postJson('/api/admin/teams', []);

    $response->assertStatus(422)
        ->assertJsonStructure([
            'status',
            'message',
            'errors',
        ]);
});

it('should return standardized error for method not allowed', function () {
    $response = getJson('/api/login');

    $response->assertStatus(405)
        ->assertJson([
            'status' => 'error',
        ]);
});
