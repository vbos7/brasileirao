<?php

use App\Models\User;

use function Pest\Laravel\{actingAs, putJson};

it('user should be able to update own profile', function () {
    $user = User::factory()->create([
        'name'  => 'Vinicius',
        'email' => 'example@gmail.com',
    ]);

    $response = actingAs($user)
        ->putJson('/api/profile', [
            'name'  => 'Vinicius Boschetti',
            'email' => 'novo@gmail.com',
        ]);

    $response->assertOk();

    expect($user->fresh()->name)->toBe('Vinicius Boschetti')
        ->and($user->fresh()->email)->toBe('novo@gmail.com');
});

it('user should not be able to change own role', function () {
    $user = User::factory()->create();

    actingAs($user)
        ->putJson('/api/profile', [
            'name' => $user->name,
            'role' => 'admin',
        ]);

    expect($user->fresh()->role)->toBe('user');
});

it('user should not update email to an already taken email', function () {
    User::factory()->create(['email' => 'existente@gmail.com']);
    $user = User::factory()->create();

    $response = actingAs($user)
        ->putJson('/api/profile', [
            'name'  => 'Vinicius',
            'email' => 'existente@gmail.com',
        ]);

    $response->assertStatus(422);
});

it('unauthenticated user should not access profile', function () {
    $response = putJson('/api/profile', [
        'name' => 'Hacker',
    ]);

    $response->assertStatus(401);
});
