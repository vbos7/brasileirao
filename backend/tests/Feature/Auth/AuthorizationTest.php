<?php

use App\Models\User;

use function Pest\Laravel\actingAs;

it('admin should be able to access admin routes', function () {
    $admin = User::factory()->create(['role' => 'admin']);

    $response = actingAs($admin)
        ->getJson('/api/admin/test');

    $response->assertOk();
});

it('user should not access admin routes', function () {
    $user = User::factory()->create();

    $response = actingAs($user)
        ->getJson('/api/admin/test');

    $response->assertStatus(403)
        ->assertJson([
            'status'  => 'error',
            'message' => 'Acesso negado.',
        ]);
});

it('user should have default role as user', function () {
    $user = User::factory()->create();

    expect($user->role)->toBe('user');
});

it('should identify admin correctly', function () {
    $admin = User::factory()->create(['role' => 'admin']);

    expect($admin->isAdmin())->toBeTrue();
});
