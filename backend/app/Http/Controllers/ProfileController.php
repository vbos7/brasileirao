<?php

namespace App\Http\Controllers;

use Illuminate\Http\{JsonResponse, Request};
use Illuminate\Support\Facades\Hash;

class ProfileController extends Controller
{
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

        return response()->json($request->user()->fresh());
    }
}
