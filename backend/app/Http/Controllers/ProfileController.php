<?php

namespace App\Http\Controllers;

use Illuminate\Http\{JsonResponse, Request};

class ProfileController extends Controller
{
    public function __invoke(Request $request): JsonResponse
    {
        $request->validate([
            'name'  => ['sometimes', 'string', 'max:255'],
            'email' => ['sometimes', 'email', 'unique:users,email,' . $request->user()->id],
        ]);

        // atualiza apenas name e email, ignorando o role
        $request->user()->update($request->only(['name', 'email']));

        return response()->json($request->user()->fresh());
    }
}
