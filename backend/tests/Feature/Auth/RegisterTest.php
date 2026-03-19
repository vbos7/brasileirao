<?php

use App\Models\User;

use function Pest\Laravel\{assertDatabaseHas, postJson};

it('should be able to register a new user', function () {
    // cria um uusário em memória sem persistir no banco
    $user = User::factory()->make();

    // rota de registro
    $response = postJson('/api/register', [
        'name'                  => $user->name,
        'email'                 => $user->email,
        'password'              => 'password@123',
        'password_confirmation' => 'password@123',
    ]);

    // verifica que a API retornou 201 e o JSON tem a estrutura esperada
    $response->assertStatus(201)
        ->assertJsonStructure([
            'user' => ['id', 'name', 'email', 'role'],
            'token', // token Sanctum para autenticação
        ]);

    // verifica que o usuário foi salvo no banco com o role padrão
    assertDatabaseHas('users', [
        'email' => $user->email,
        'role'  => 'user',
    ]);
});

it('should not register with duplicate email', function () {
    // cria um usuário que persiste no banco
    $existing = User::factory()->create();

    $response = postJson('/api/register', [
        'name'                  => fake()->name(),
        'email'                 => $existing->email,
        'password'              => 'password@123',
        'password_confirmation' => 'password@123',
    ]);

    // validação deve rejeitar email duplicado
    $response->assertStatus(422);
});

it('should not register without required fields', function () {
    $response = postJson('/api/register', []);

    $response->assertStatus(422)
        ->assertJsonValidationErrors(['name', 'email', 'password']);
});
