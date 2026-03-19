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

it('changing password revokes all existing tokens and returns a new one', function () {
    $user     = User::factory()->create();
    $oldToken = $user->createToken('old_token')->plainTextToken;

    $response = actingAs($user)
        ->putJson('/api/profile', [
            'current_password'      => 'password@123',
            'password'              => 'newPassword@123',
            'password_confirmation' => 'newPassword@123',
        ]);

    $response->assertOk()
        ->assertJsonStructure(['user', 'token']);

    expect($user->tokens()->count())->toBe(1)
        ->and($response->json('token'))->not->toBe($oldToken);
});
