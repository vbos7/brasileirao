<?php

use App\Models\User;

use function Pest\Laravel\{assertDatabaseCount, postJson, withHeader};

it('should be able to logout', function () {
    $user = User::factory()->create();

    $token = $user->createToken('auth_token')->plainTextToken;

    $response = withHeader('Authorization', "Bearer {$token}")
        ->postJson('/api/logout');

    $response->assertOk()
        ->assertJson([
            'message' => 'Logout realizado com sucesso.',
        ]);

    assertDatabaseCount('personal_access_tokens', 0);
});

it('should not logout without token', function () {
    $response = postJson('/api/logout');

    $response->assertStatus(401);
});
