# Brasileirão - Campeonato Brasileiro Série A

Sistema Full Stack que simula o Campeonato Brasileiro Série A, permitindo a listagem da tabela de classificação e o gerenciamento administrativo de times e jogos.

## Tecnologias

**Backend:** Laravel 12, PHP 8.3+, MySQL 8, Laravel Sanctum (autenticação via token)

**Frontend:** Next.js 15, TypeScript, TailwindCSS, shadcn/ui, React Hook Form, Zod

**Testes:** Pest PHP

**Infraestrutura:** Docker, Docker Compose

## Requisitos

- Docker e Docker Compose instalados
- Portas disponíveis: `3000` (frontend), `8000` (backend), `3306` (MySQL)

## Como rodar o projeto

```bash
# 1. Clonar o repositório
git clone https://github.com/vbos7/brasileirao.git
cd brasileirao

# 2. Copiar o .env do backend
cp backend/.env.example backend/.env

# 3. Configurar o .env do backend com as credenciais do banco
# DB_CONNECTION=mysql
# DB_HOST=mysql
# DB_PORT=3306
# DB_DATABASE=brasileirao
# DB_USERNAME=laravel
# DB_PASSWORD=secret

# 4. Subir os containers
docker compose up --build -d

# 5. Rodar migrations e seed
docker compose exec backend php artisan migrate:fresh --seed

# 6. Acessar
# Frontend: http://localhost:3000
# API: http://localhost:8000/api
```

## Usuários padrão

| Perfil | E-mail | Senha |
|--------|--------|-------|
| Admin | admin@brasileirao.com | password@123 |
| Usuário | user@brasileirao.com | password@123 |

## Funcionalidades

### Autenticação
- Registro, Login, Logout
- Refresh Token
- Tokens com expiração via Laravel Sanctum
- Perfis: `admin` e `user`

### Tabela de Classificação (pública)
- Gerada dinamicamente a partir dos jogos realizados
- Colunas: Time, Pontos, Jogos, Vitórias, Empates, Derrotas, Gols Pró, Gols Contra, Saldo de Gols
- Critério de desempate: 1º Pontos → 2º Saldo de Gols → 3º Gols Pró

### Gerenciamento de Times (admin)
- CRUD completo
- Validação de nome duplicado

### Gerenciamento de Jogos (admin)
- Criação de jogos (validação: time casa ≠ time visitante)
- Lançamento de placar (valores não negativos, status muda para "realizado")
- Exclusão permitida apenas para jogos realizados nos últimos 3 dias
- Listagem com paginação
- Filtros por nome do time e período

### Edição de Perfil (usuário)
- Edição de nome e e-mail
- Alteração de senha (exige confirmação da senha atual)
- Usuário não consegue alterar a própria role

### Tratamento de Erros
- Respostas padronizadas: `{"status": "error", "message": "..."}`
- Interceptor HTTP no frontend
- Feedback visual com toasts
- Validação de formulários em tempo real

### Segurança
- Senhas criptografadas (bcrypt)
- Proteção contra SQL Injection (Eloquent ORM)
- Controle de acesso por role nas rotas da API
- Middleware de proteção no frontend
- Dados sensíveis não expostos no frontend

## Documentação da API (Swagger)

Após subir o projeto, gere a documentação e acesse:

```bash
docker compose exec backend php artisan l5-swagger:generate
```

```
http://localhost:8000/api/documentation
```

## Rodando os testes

```bash
docker compose exec backend php artisan test
```

## Estrutura do projeto

```
brasileirao/
├── backend/           # Laravel 12 (API)
│   ├── app/
│   ├── database/
│   ├── routes/
│   ├── tests/
│   └── Dockerfile
├── frontend/          # Next.js 15
│   ├── src/
│   │   ├── app/
│   │   ├── components/
│   │   ├── lib/
│   │   └── types/
│   └── Dockerfile
├── docker-compose.yml
└── README.md
```

## Endpoints da API

### Públicos
| Método | Rota | Descrição |
|--------|------|-----------|
| POST | /api/register | Registro |
| POST | /api/login | Login |
| GET | /api/standings | Tabela de classificação |

### Autenticados
| Método | Rota | Descrição |
|--------|------|-----------|
| POST | /api/logout | Logout |
| POST | /api/refresh | Refresh token |
| PUT | /api/profile | Editar perfil |

### Admin
| Método | Rota | Descrição |
|--------|------|-----------|
| GET | /api/admin/teams | Listar times |
| POST | /api/admin/teams | Criar time |
| GET | /api/admin/teams/{id} | Detalhe do time |
| PUT | /api/admin/teams/{id} | Editar time |
| DELETE | /api/admin/teams/{id} | Excluir time |
| GET | /api/admin/games | Listar jogos (paginado) |
| POST | /api/admin/games | Criar jogo |
| PATCH | /api/admin/games/{id}/score | Lançar placar |
| DELETE | /api/admin/games/{id} | Excluir jogo |