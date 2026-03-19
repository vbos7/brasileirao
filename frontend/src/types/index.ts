export interface User {
    id: number;
    name: string;
    email: string;
    role: "admin" | "user";
}

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