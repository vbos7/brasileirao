<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\{JsonResponse, Request};

class RefreshTokenController extends Controller
{
    public function __invoke(Request $request): JsonResponse
    {
        // revoga o token atual e emite um novo
        $request->user()->currentAccessToken()->delete();

        $token = $request->user()->createToken('auth_token')->plainTextToken;

        return response()->json(['token' => $token]);
    }
}
