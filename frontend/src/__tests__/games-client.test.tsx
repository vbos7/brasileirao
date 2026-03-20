import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi, describe, it, expect, beforeEach } from "vitest";
import { GamesClient } from "@/components/games-client";
import { toast } from "sonner";

const mocks = vi.hoisted(() => ({
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
}));

vi.mock("@/lib/api", () => ({
    default: { get: mocks.get, post: mocks.post, patch: mocks.patch, delete: mocks.delete },
}));

const mockGet = mocks.get;
const mockPost = mocks.post;
const mockPatch = mocks.patch;
const mockDelete = mocks.delete;

const mockTeams = [
    { id: 1, name: "Flamengo", short_name: "FLA" },
    { id: 2, name: "Palmeiras", short_name: "PAL" },
];

const mockGame = {
    id: 1,
    home_team: { id: 1, name: "Flamengo", short_name: "FLA" },
    away_team: { id: 2, name: "Palmeiras", short_name: "PAL" },
    home_score: null,
    away_score: null,
    status: "pendente",
    game_date: "2026-03-20T15:00:00",
};

const mockGameRealizado = {
    ...mockGame,
    id: 2,
    status: "realizado",
    home_score: 2,
    away_score: 1,
};

function gamesResponse(games = [mockGame], lastPage = 1) {
    return { data: { data: games, meta: { current_page: 1, last_page: lastPage } } };
}

describe("GamesClient", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockGet.mockImplementation((url: string) => {
            if (url === "/admin/teams") return Promise.resolve({ data: mockTeams });
            return Promise.resolve(gamesResponse([mockGame]));
        });
    });

    it("shows loading state and then the games list", async () => {
        render(<GamesClient />);

        expect(screen.getByText("Carregando...")).toBeInTheDocument();

        await waitFor(() => {
            expect(screen.getByText("Flamengo")).toBeInTheDocument();
        });
    });

    it("shows message when there are no games", async () => {
        mockGet.mockImplementation((url: string) => {
            if (url === "/admin/teams") return Promise.resolve({ data: mockTeams });
            return Promise.resolve(gamesResponse([]));
        });
        render(<GamesClient />);

        await waitFor(() => {
            expect(screen.getByText("Nenhum jogo encontrado.")).toBeInTheDocument();
        });
    });

    it("shows '- x -' for pending games and score for completed ones", async () => {
        mockGet.mockImplementation((url: string) => {
            if (url === "/admin/teams") return Promise.resolve({ data: mockTeams });
            return Promise.resolve(gamesResponse([mockGame, mockGameRealizado]));
        });
        render(<GamesClient />);

        await waitFor(() => {
            expect(screen.getByText("- x -")).toBeInTheDocument();
            expect(screen.getByText("2 x 1")).toBeInTheDocument();
        });
    });

    it("shows 'Placar' button only for pending games", async () => {
        mockGet.mockImplementation((url: string) => {
            if (url === "/admin/teams") return Promise.resolve({ data: mockTeams });
            return Promise.resolve(gamesResponse([mockGame, mockGameRealizado]));
        });
        render(<GamesClient />);

        await waitFor(() => {
            const placarButtons = screen.getAllByRole("button", { name: /^placar$/i });
            expect(placarButtons).toHaveLength(1);
        });
    });

    it("does not show pagination when there is only one page", async () => {
        render(<GamesClient />);

        await waitFor(() => screen.getByText("Flamengo"));

        expect(screen.queryByRole("navigation", { name: /pagination/i })).not.toBeInTheDocument();
    });

    it("shows pagination when there is more than one page", async () => {
        mockGet.mockImplementation((url: string) => {
            if (url === "/admin/teams") return Promise.resolve({ data: mockTeams });
            return Promise.resolve(gamesResponse([mockGame], 3));
        });
        render(<GamesClient />);

        await waitFor(() => {
            expect(screen.getByRole("navigation", { name: /pagination/i })).toBeInTheDocument();
        });
    });

    it("opens the create game dialog when clicking 'Novo Jogo'", async () => {
        const user = userEvent.setup();
        render(<GamesClient />);

        await waitFor(() => screen.getByRole("button", { name: /novo jogo/i }));
        await user.click(screen.getByRole("button", { name: /novo jogo/i }));

        expect(screen.getByRole("dialog")).toBeInTheDocument();
        expect(screen.getByRole("heading", { name: /novo jogo/i })).toBeInTheDocument();
    });

    it("shows error toast when failing to load games", async () => {
        mockGet.mockImplementation((url: string) => {
            if (url === "/admin/teams") return Promise.resolve({ data: mockTeams });
            return Promise.reject(new Error("Erro"));
        });
        render(<GamesClient />);

        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith("Erro ao carregar jogos.");
        });
    });

    it("deletes a game after confirmation", async () => {
        const user = userEvent.setup();
        vi.stubGlobal("confirm", vi.fn().mockReturnValue(true));
        mockDelete.mockResolvedValue({});
        render(<GamesClient />);

        await waitFor(() => screen.getByText("Flamengo"));
        await user.click(screen.getByRole("button", { name: /excluir/i }));

        await waitFor(() => {
            expect(mockDelete).toHaveBeenCalledWith("/admin/games/1");
            expect(toast.success).toHaveBeenCalledWith("Jogo excluído.");
        });
    });
});
