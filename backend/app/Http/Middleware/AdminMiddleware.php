<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class AdminMiddleware
{
    public function handle(Request $request, Closure $next): Response
    {
        // bloqueia usuários que não são admin
        if (!$request->user()?->isAdmin()) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Acesso negado.',
            ], 403);
        }

        return $next($request);
    }
}
