export interface Standing {
    team: string;
    points: number;
    games: number;
    wins: number;
    draws: number;
    losses: number;
    goals_for: number;
    goals_against: number;
    goal_difference: number;
}

export interface User {
    id: number;
    name: string;
    email: string;
    role: "admin" | "user";
}

export interface Team {
    id: number;
    name: string;
    short_name: string;
}

export interface Game {
    id: number;
    home_team_id: number;
    away_team_id: number;
    home_team: Team;
    away_team: Team;
    home_score: number | null;
    away_score: number | null;
    status: "pendente" | "realizado";
    game_date: string;
}