<?php

namespace App\Models;

use Database\Factories\GameFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Game extends Model
{
    /** @use HasFactory<GameFactory> */
    use HasFactory;

    protected $fillable = [
        'home_team_id',
        'away_team_id',
        'game_date',
        'status',
        'home_score',
        'away_score',
    ];

    protected function casts(): array
    {
        return [
            'game_date'  => 'datetime',
            'home_score' => 'integer',
            'away_score' => 'integer',
        ];
    }

    /** @return BelongsTo<Team, $this> */
    public function homeTeam(): BelongsTo
    {
        return $this->belongsTo(Team::class, 'home_team_id');
    }

    /** @return BelongsTo<Team, $this> */
    public function awayTeam(): BelongsTo
    {
        return $this->belongsTo(Team::class, 'away_team_id');
    }
}
