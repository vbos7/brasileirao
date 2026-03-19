<?php

namespace App\Http\Controllers;

use Illuminate\Http\{JsonResponse, Request};
use Illuminate\Support\Facades\Hash;
use OpenApi\Attributes as OA;

class ProfileController extends Controller
{
    #[OA\Put(
        path: '/api/profile',
        tags: ['Profile'],
        summary: 'Atualizar perfil do usuário autenticado',
        security: [['sanctum' => []]],
        requestBody: new OA\RequestBody(
            content: new OA\JsonContent(properties: [
                new OA\Property(property: 'name', type: 'string', example: 'João Silva'),
                new OA\Property(property: 'email', type: 'string', format: 'email', example: 'joao@email.com'),
                new OA\Property(property: 'current_password', type: 'string', example: 'password@123'),
                new OA\Property(property: 'password', type: 'string', minLength: 8, example: 'novaSenha@123'),
                new OA\Property(property: 'password_confirmation', type: 'string', example: 'novaSenha@123'),
            ])
        ),
        responses: [
            new OA\Response(response: 200, description: 'Perfil atualizado'),
            new OA\Response(response: 422, description: 'Erro de validação'),
            new OA\Response(response: 401, description: 'Não autenticado'),
        ]
    )]
    public function __invoke(Request $request): JsonResponse
    {
        $request->validate([
            'name'             => ['sometimes', 'string', 'max:255'],
            'email'            => ['sometimes', 'email', 'unique:users,email,' . $request->user()->id],
            'current_password' => ['required_with:password', 'string'],
            'password'         => ['sometimes', 'string', 'min:8', 'confirmed'],
        ]);

        if ($request->filled('password')) {
            if (!Hash::check($request->current_password, $request->user()->password)) {
                return response()->json([
                    'message' => 'Senha atual incorreta.',
                    'errors'  => ['current_password' => ['Senha atual incorreta.']],
                ], 422);
            }
        }

        $data = $request->only(['name', 'email']);

        if ($request->filled('password')) {
            $data['password'] = $request->password;
        }

        $request->user()->update($data);

        // troca de senha invalida todos os tokens existentes e emite um novo
        if ($request->filled('password')) {
            $request->user()->tokens()->delete();
            $token = $request->user()->createToken('auth_token')->plainTextToken;

            return response()->json([
                'user'  => $request->user()->fresh()->only('id', 'name', 'email', 'role'),
                'token' => $token,
            ]);
        }

        return response()->json([
            'user' => $request->user()->fresh()->only('id', 'name', 'email', 'role'),
        ]);
    }
}
