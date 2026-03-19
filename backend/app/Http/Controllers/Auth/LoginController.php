<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\{JsonResponse, Request};
use Illuminate\Support\Facades\Hash;
use OpenApi\Attributes as OA;

class LoginController extends Controller
{
    #[OA\Post(
        path: '/api/login',
        tags: ['Auth'],
        summary: 'Autenticar usuário',
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ['email', 'password'],
                properties: [
                    new OA\Property(property: 'email', type: 'string', format: 'email', example: 'admin@brasileirao.com'),
                    new OA\Property(property: 'password', type: 'string', example: 'password@123'),
                ]
            )
        ),
        responses: [
            new OA\Response(
                response: 200,
                description: 'Login realizado',
                content: new OA\JsonContent(properties: [
                    new OA\Property(property: 'user', type: 'object', properties: [
                        new OA\Property(property: 'id', type: 'integer'),
                        new OA\Property(property: 'name', type: 'string'),
                        new OA\Property(property: 'email', type: 'string'),
                        new OA\Property(property: 'role', type: 'string', enum: ['admin', 'user']),
                    ]),
                    new OA\Property(property: 'token', type: 'string'),
                ])
            ),
            new OA\Response(response: 401, description: 'Credenciais inválidas'),
        ]
    )]
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
