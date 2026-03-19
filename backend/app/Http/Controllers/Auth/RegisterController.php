<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\{JsonResponse, Request};
use OpenApi\Attributes as OA;

class RegisterController extends Controller
{
    #[OA\Post(
        path: '/api/register',
        tags: ['Auth'],
        summary: 'Registrar novo usuário',
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ['name', 'email', 'password', 'password_confirmation'],
                properties: [
                    new OA\Property(property: 'name', type: 'string', example: 'João Silva'),
                    new OA\Property(property: 'email', type: 'string', format: 'email', example: 'joao@email.com'),
                    new OA\Property(property: 'password', type: 'string', minLength: 8, example: 'password@123'),
                    new OA\Property(property: 'password_confirmation', type: 'string', example: 'password@123'),
                ]
            )
        ),
        responses: [
            new OA\Response(
                response: 201,
                description: 'Usuário criado',
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
            new OA\Response(response: 422, description: 'Erro de validação'),
        ]
    )]
    public function __invoke(Request $request): JsonResponse
    {
        $request->validate([
            'name'     => ['required', 'string', 'max:255'],
            'email'    => ['required', 'email', 'unique:users'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ]);

        $user = User::create([
            'name'     => $request->name,
            'email'    => $request->email,
            'password' => $request->password,
        ]);

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'user'  => $user->only('id', 'name', 'email', 'role'),
            'token' => $token,
        ], 201);
    }
}
