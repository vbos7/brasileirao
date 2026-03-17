<?php

use App\Models\User;

use function Pest\Laravel\assertDatabaseHas;
use function Pest\Laravel\postJson;

it('should be able to register a new user', function () {
    // cria um uusário em memória sem persistir no banco
    $user = User::factory()->make();

    // rota de registro
    $request = postJson('/api/register', [
        'name' => $user->name,
        'email' => $user->email,
        'password' => 'password@123',
        'password_confirmation' => 'password@123',
    ]);

    // verifica que a API retornou 201 e o JSON tem a estrutura esperada
    $request->assertStatus(201)
        ->assertJsonStructure([
            'user' => ['id', 'name', 'email'],
            'token', // token Sanctum para autenticação
        ]);

    // verifica que o usuário foi salvo no banco com o role padrão
    assertDatabaseHas('users', [
        'email' => $user->email,
        'role' => 'user',
    ]);
});

it('should not register with duplicate email', function () {
    // cria um usuário que persiste no banco
    $existing = User::factory()->create();

    $request = postJson('/api/register', [
        'name' => fake()->name(),
        'email' => $existing->email,
        'password' => 'password@123',
        'password_confirmation' => 'password@123',
    ]);

    // validação deve rejeitar email duplicado
    $request->assertStatus(422);
});

it('should not register without required fields', function () {
    $request = postJson('/api/register', []);

    $request->assertStatus(422)
        ->assertJsonValidationErrors(['name', 'email', 'password']);
});
