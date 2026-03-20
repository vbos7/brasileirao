<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Game;
use Illuminate\Http\{JsonResponse, Request};
use OpenApi\Attributes as OA;

class GameController extends Controller
{
    #[OA\Get(
        path: '/api/admin/games',
        tags: ['Admin - Games'],
        summary: 'Listar jogos com paginação e filtros',
        security: [['sanctum' => []]],
        parameters: [
            new OA\Parameter(name: 'page', in: 'query', schema: new OA\Schema(type: 'integer', default: 1)),
            new OA\Parameter(name: 'team', in: 'query', description: 'Filtrar por nome do time', schema: new OA\Schema(type: 'string')),
            new OA\Parameter(name: 'date_from', in: 'query', description: 'Data inicial (Y-m-d)', schema: new OA\Schema(type: 'string', format: 'date')),
            new OA\Parameter(name: 'date_to', in: 'query', description: 'Data final (Y-m-d)', schema: new OA\Schema(type: 'string', format: 'date')),
        ],
        responses: [
            new OA\Response(response: 200, description: 'Lista paginada de jogos'),
            new OA\Response(response: 403, description: 'Acesso negado'),
        ]
    )]
    public function index(Request $request): JsonResponse
    {
        $query = Game::query();

        // filtra por nome de time (casa ou visitante)
        if ($request->team) {
            $query->where(function ($q) use ($request) {
                $q->whereHas('homeTeam', fn ($q) => $q->where('name', $request->team))
                    ->orWhereHas('awayTeam', fn ($q) => $q->where('name', $request->team));
            });
        }

        // filtra por intervalo de datas
        if ($request->date_from) {
            $query->where('game_date', '>=', $request->date_from);
        }

        if ($request->date_to) {
            $query->where('game_date', '<=', $request->date_to . ' 23:59:59');
        }

        $games = $query->with(['homeTeam', 'awayTeam'])->paginate(15);

        // formata a paginação no padrão esperado pela API
        return response()->json([
            'data' => $games->items(),
            'meta' => [
                'current_page' => $games->currentPage(),
                'last_page'    => $games->lastPage(),
                'per_page'     => $games->perPage(),
                'total'        => $games->total(),
            ],
        ]);
    }

    #[OA\Post(
        path: '/api/admin/games',
        tags: ['Admin - Games'],
        summary: 'Criar jogo',
        security: [['sanctum' => []]],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ['home_team_id', 'away_team_id', 'game_date'],
                properties: [
                    new OA\Property(property: 'home_team_id', type: 'integer', example: 1),
                    new OA\Property(property: 'away_team_id', type: 'integer', example: 2),
                    new OA\Property(property: 'game_date', type: 'string', format: 'date-time', example: '2026-05-10 16:00:00'),
                ]
            )
        ),
        responses: [
            new OA\Response(response: 201, description: 'Jogo criado'),
            new OA\Response(response: 422, description: 'Erro de validação'),
            new OA\Response(response: 403, description: 'Acesso negado'),
        ]
    )]
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'home_team_id' => ['required', 'integer', 'exists:teams,id'],
            'away_team_id' => ['required', 'integer', 'exists:teams,id', 'different:home_team_id'],
            'game_date'    => ['required', 'date'],
        ]);

        $game = Game::create([
            'home_team_id' => $request->home_team_id,
            'away_team_id' => $request->away_team_id,
            'game_date'    => $request->game_date,
            'status'       => 'pendente',
        ]);

        return response()->json($game, 201);
    }

    #[OA\Patch(
        path: '/api/admin/games/{id}/score',
        tags: ['Admin - Games'],
        summary: 'Lançar placar do jogo',
        security: [['sanctum' => []]],
        parameters: [new OA\Parameter(name: 'id', in: 'path', required: true, schema: new OA\Schema(type: 'integer'))],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ['home_score', 'away_score'],
                properties: [
                    new OA\Property(property: 'home_score', type: 'integer', minimum: 0, example: 2),
                    new OA\Property(property: 'away_score', type: 'integer', minimum: 0, example: 1),
                ]
            )
        ),
        responses: [
            new OA\Response(response: 200, description: 'Placar registrado, status muda para realizado'),
            new OA\Response(response: 404, description: 'Jogo não encontrado'),
            new OA\Response(response: 422, description: 'Erro de validação'),
            new OA\Response(response: 403, description: 'Acesso negado'),
        ]
    )]
    public function updateScore(Request $request, int $id): JsonResponse
    {
        $game = Game::find($id);

        if (!$game) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Jogo não encontrado.',
            ], 404);
        }

        $request->validate([
            'home_score' => ['required', 'integer', 'min:0'],
            'away_score' => ['required', 'integer', 'min:0'],
        ]);

        $game->update([
            'home_score' => $request->home_score,
            'away_score' => $request->away_score,
            'status'     => 'realizado', // ao registrar placar o jogo é marcado como realizado
        ]);

        return response()->json($game);
    }

    #[OA\Delete(
        path: '/api/admin/games/{id}',
        tags: ['Admin - Games'],
        summary: 'Excluir jogo (apenas realizados nos últimos 3 dias)',
        security: [['sanctum' => []]],
        parameters: [new OA\Parameter(name: 'id', in: 'path', required: true, schema: new OA\Schema(type: 'integer'))],
        responses: [
            new OA\Response(response: 200, description: 'Jogo removido'),
            new OA\Response(response: 403, description: 'Exclusão não permitida ou acesso negado'),
            new OA\Response(response: 404, description: 'Jogo não encontrado'),
        ]
    )]
    public function destroy(int $id): JsonResponse
    {
        $game = Game::find($id);

        if (!$game) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Jogo não encontrado.',
            ], 404);
        }

        // só permite deletar jogos realizados nos últimos 3 dias
        if ($game->status !== 'realizado' || $game->updated_at->lt(now()->subDays(3))) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Não é possível deletar este jogo.',
            ], 403);
        }

        $game->delete();

        return response()->json(['message' => 'Jogo removido com sucesso.']);
    }
}
