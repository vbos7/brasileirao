<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Team;
use Illuminate\Http\{JsonResponse, Request};

class TeamController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(Team::all());
    }

    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'name'       => ['required', 'string', 'unique:teams'],
            'short_name' => ['required', 'string', 'max:3'],
        ]);

        $team = Team::create($request->only('name', 'short_name'));

        return response()->json($team, 201);
    }

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
