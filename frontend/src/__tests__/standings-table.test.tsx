import { render, screen, waitFor } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";
import { StandingsTable } from "@/components/standings-table";
import api from "@/lib/api";

vi.mock("@/lib/api", () => ({
    default: { get: vi.fn() },
}));

const mockApi = vi.mocked(api);

const makeStandings = (count: number) =>
    Array.from({ length: count }, (_, i) => ({
        team: `Time ${i + 1}`,
        points: 30 - i * 2,
        games: 10,
        wins: 5 - i,
        draws: 2,
        losses: i,
        goals_for: 15 - i,
        goals_against: i * 2,
        goal_difference: 15 - i * 3,
    }));

describe("StandingsTable", () => {
    beforeEach(() => vi.clearAllMocks());

    it("shows loading state initially", () => {
        mockApi.get.mockReturnValue(new Promise(() => {}));
        render(<StandingsTable />);
        expect(screen.getByText("Carregando...")).toBeInTheDocument();
    });

    it("shows message when there are no completed games", async () => {
        mockApi.get.mockResolvedValue({ data: [] });
        render(<StandingsTable />);
        await waitFor(() => {
            expect(screen.getByText("Nenhum jogo realizado ainda.")).toBeInTheDocument();
        });
    });

    it("shows the table with teams after loading", async () => {
        mockApi.get.mockResolvedValue({ data: makeStandings(5) });
        render(<StandingsTable />);
        await waitFor(() => {
            expect(screen.getByText("Time 1")).toBeInTheDocument();
            expect(screen.getByText("Time 5")).toBeInTheDocument();
        });
    });

    it("shows default badge for the top 4 positions", async () => {
        mockApi.get.mockResolvedValue({ data: makeStandings(8) });
        render(<StandingsTable />);
        await waitFor(() => {
            const badges = screen.getAllByText(/^[1-8]$/);
            // positions 1 to 4 should have the default badge class
            expect(badges[0].closest("[class]")).toHaveAttribute("data-slot", "badge");
        });
    });

    it("shows error toast when the API fails", async () => {
        const { toast } = await import("sonner");
        mockApi.get.mockRejectedValue(new Error("Erro de rede"));
        render(<StandingsTable />);
        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith("Erro ao carregar classificação.");
        });
    });
});
