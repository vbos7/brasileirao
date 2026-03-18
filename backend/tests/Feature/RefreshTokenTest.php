<?php

use App\Models\User;

use function Pest\Laravel\{assertDatabaseCount, postJson};

it('should be able to refresh token', function () {
    $user  = User::factory()->create();
    $token = $user->createToken('auth_token')->plainTextToken;

    $response = test()->withToken($token)->postJson('/api/refresh');

    $response->assertOk()
        ->assertJsonStructure(['token']);

    // token antigo deve ter sido excluido, só o novo fica
    assertDatabaseCount('personal_access_tokens', 1);
});

it('should not refresh without valid token', function () {
    $response = postJson('/api/refresh');

    $response->assertStatus(401);
});

it('new token should work after refresh', function () {
    $user  = User::factory()->create();
    $token = $user->createToken('auth_token')->plainTextToken;

    $newToken = test()->withToken($token)
        ->postJson('/api/refresh')
        ->json('token');

    // novo token deve funcionar em rotas autenticadas
    test()->withToken($newToken)->getJson('/api/user')->assertOk();

    // reseta o cache do guard para forçar nova resolução do token
    app('auth')->forgetGuards();

    // token antigo não deve ser aceito
    test()->withToken($token)->getJson('/api/user')->assertStatus(401);
});
