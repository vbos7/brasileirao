<?php

use App\Models\User;

use function Pest\Laravel\postJson;

it('should be able to login with valid credentials', function () {
    $user = User::factory()->create();

    $response = postJson('/api/login', [
        'email'    => $user->email,
        'password' => 'password@123',
    ]);

    $response->assertOk()
        ->assertJsonStructure([
            'user' => ['id', 'name', 'email'],
            'token',
        ]);
});

it('should not login with wrong password', function () {
    $user = User::factory()->create();

    $response = postJson('/api/login', [
        'email'    => $user->email,
        'password' => 'senhaerrada',
    ]);

    $response->assertStatus(401)
        ->assertJson([
            'status'  => 'error',
            'message' => 'Credenciais inválidas.',
        ]);
});

it('should not login with non-existent email', function () {
    $response = postJson('/api/login', [
        'email'    => 'naoexiste@gmail.com',
        'password' => 'password@123',
    ]);

    $response->assertStatus(401);
});
