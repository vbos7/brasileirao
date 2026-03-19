<?php

namespace App\Http\Controllers;

use OpenApi\Attributes as OA;

#[OA\Info(title: 'Brasileirão API', version: '1.0.0', description: 'API REST para o sistema do Campeonato Brasileiro Série A')]
#[OA\Server(url: L5_SWAGGER_CONST_HOST, description: 'Servidor local')]
#[OA\SecurityScheme(securityScheme: 'sanctum', type: 'http', scheme: 'bearer', bearerFormat: 'JWT')]
#[OA\Tag(name: 'Auth', description: 'Autenticação')]
#[OA\Tag(name: 'Profile', description: 'Perfil do usuário')]
#[OA\Tag(name: 'Standings', description: 'Tabela de classificação')]
#[OA\Tag(name: 'Admin - Teams', description: 'Gerenciamento de times (admin)')]
#[OA\Tag(name: 'Admin - Games', description: 'Gerenciamento de jogos (admin)')]
abstract class Controller
{
    //
}
