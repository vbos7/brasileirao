<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\{JsonResponse, Request};
use Illuminate\Support\Facades\Hash;

class LoginController extends Controller
{
    public function __invoke(Request $request): JsonResponse
    {
        $request->validate([
            'email'    => ['required', 'email'],
            'password' => ['required', 'string'],
        ]);

        // busca o usuário pelo email informado
        $user = User::where('email', $request->email)->first();

        // retorna 401 se o usuário não existir ou se a senha não bater com o hash no banco
        if (!$user || !Hash::check($request->password, $user->password)) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Credenciais inválidas.',
            ], 401);
        }

        // gera um token Sanctum e retorna o texto puro (salvo como hash no banco)
        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'user'  => $user->only('id', 'name', 'email', 'role'),
            'token' => $token,
        ]);
    }
}
