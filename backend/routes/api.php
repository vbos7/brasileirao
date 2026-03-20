<?php

use App\Http\Controllers\Admin\{GameController, TeamController};
use App\Http\Controllers\Auth\{LoginController, LogoutController, RefreshTokenController, RegisterController};
use App\Http\Controllers\{ProfileController, StandingsController};
use Illuminate\Support\Facades\Route;

Route::middleware('throttle:10,1')->group(function () {
    Route::post('/register', RegisterController::class);
    Route::post('/login', LoginController::class);
});

Route::get('/standings', StandingsController::class);

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', LogoutController::class);
    Route::post('/refresh', RefreshTokenController::class);
    Route::get('/user', fn () => request()->user());
    Route::put('/profile', ProfileController::class);

    // rotas acessíveis apenas por administradores
    Route::middleware('admin')->prefix('admin')->group(function () {
        Route::get('/test', fn () => response()->json(['message' => 'ok']));
        Route::apiResource('/teams', TeamController::class);
        Route::apiResource('/games', GameController::class)->only(['index', 'store', 'destroy']);
        Route::patch('/games/{id}/score', [GameController::class, 'updateScore']);
    });
});
