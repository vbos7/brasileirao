<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Team;
use Illuminate\Http\{JsonResponse, Request};
use OpenApi\Attributes as OA;

class TeamController extends Controller
{
    #[OA\Get(
        path: '/api/admin/teams',
        tags: ['Admin - Teams'],
        summary: 'Listar todos os times',
        security: [['sanctum' => []]],
        responses: [
            new OA\Response(response: 200, description: 'Lista de times'),
            new OA\Response(response: 403, description: 'Acesso negado'),
        ]
    )]
    public function index(): JsonResponse
    {
        return response()->json(Team::all());
    }

    #[OA\Post(
        path: '/api/admin/teams',
        tags: ['Admin - Teams'],
        summary: 'Criar time',
        security: [['sanctum' => []]],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ['name', 'short_name'],
                properties: [
                    new OA\Property(property: 'name', type: 'string', example: 'Flamengo'),
                    new OA\Property(property: 'short_name', type: 'string', maxLength: 3, example: 'FLA'),
                ]
            )
        ),
        responses: [
            new OA\Response(response: 201, description: 'Time criado'),
            new OA\Response(response: 422, description: 'Erro de validação'),
            new OA\Response(response: 403, description: 'Acesso negado'),
        ]
    )]
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'name'       => ['required', 'string', 'unique:teams'],
            'short_name' => ['required', 'string', 'max:3'],
        ]);

        $team = Team::create($request->only('name', 'short_name'));

        return response()->json($team, 201);
    }

    #[OA\Get(
        path: '/api/admin/teams/{id}',
        tags: ['Admin - Teams'],
        summary: 'Detalhe do time',
        security: [['sanctum' => []]],
        parameters: [new OA\Parameter(name: 'id', in: 'path', required: true, schema: new OA\Schema(type: 'integer'))],
        responses: [
            new OA\Response(response: 200, description: 'Time encontrado'),
            new OA\Response(response: 404, description: 'Time não encontrado'),
            new OA\Response(response: 403, description: 'Acesso negado'),
        ]
    )]
    public function show(int $id): JsonResponse
    {
        $team = Team::find($id);

        if (!$team) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Time não encontrado.',
            ], 404);
        }

        return response()->json($team);
    }

    #[OA\Put(
        path: '/api/admin/teams/{id}',
        tags: ['Admin - Teams'],
        summary: 'Editar time',
        security: [['sanctum' => []]],
        parameters: [new OA\Parameter(name: 'id', in: 'path', required: true, schema: new OA\Schema(type: 'integer'))],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ['name', 'short_name'],
                properties: [
                    new OA\Property(property: 'name', type: 'string', example: 'Flamengo'),
                    new OA\Property(property: 'short_name', type: 'string', maxLength: 3, example: 'FLA'),
                ]
            )
        ),
        responses: [
            new OA\Response(response: 200, description: 'Time atualizado'),
            new OA\Response(response: 404, description: 'Time não encontrado'),
            new OA\Response(response: 403, description: 'Acesso negado'),
        ]
    )]
    public function update(Request $request, int $id): JsonResponse
    {
        $team = Team::find($id);

        if (!$team) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Time não encontrado.',
            ], 404);
        }

        $request->validate([
            'name'       => ['required', 'string', 'unique:teams,name,' . $team->id],
            'short_name' => ['required', 'string', 'max:3'],
        ]);

        $team->update($request->only('name', 'short_name'));

        return response()->json($team);
    }

    #[OA\Delete(
        path: '/api/admin/teams/{id}',
        tags: ['Admin - Teams'],
        summary: 'Excluir time',
        security: [['sanctum' => []]],
        parameters: [new OA\Parameter(name: 'id', in: 'path', required: true, schema: new OA\Schema(type: 'integer'))],
        responses: [
            new OA\Response(response: 200, description: 'Time removido'),
            new OA\Response(response: 404, description: 'Time não encontrado'),
            new OA\Response(response: 403, description: 'Acesso negado'),
        ]
    )]
    public function destroy(int $id): JsonResponse
    {
        $team = Team::find($id);

        if (!$team) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Time não encontrado.',
            ], 404);
        }

        $team->delete();

        return response()->json(['message' => 'Time removido com sucesso.']);
    }
}
