<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\{JsonResponse, Request};
use OpenApi\Attributes as OA;

class RefreshTokenController extends Controller
{
    #[OA\Post(
        path: '/api/refresh',
        tags: ['Auth'],
        summary: 'Renovar token de acesso',
        security: [['sanctum' => []]],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Token renovado',
                content: new OA\JsonContent(properties: [
                    new OA\Property(property: 'token', type: 'string'),
                ])
            ),
            new OA\Response(response: 401, description: 'Não autenticado'),
        ]
    )]
    public function __invoke(Request $request): JsonResponse
    {
        // revoga o token atual e emite um novo
        $request->user()->currentAccessToken()->delete();

        $token = $request->user()->createToken('auth_token')->plainTextToken;

        return response()->json(['token' => $token]);
    }
}
