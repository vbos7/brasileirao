<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Game;
use Illuminate\Http\{JsonResponse, Request};

class GameController extends Controller
{
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

        $games = $query->paginate(15);

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
