import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi, describe, it, expect, beforeEach } from "vitest";
import { TeamsClient } from "@/components/teams-client";
import { toast } from "sonner";

const mocks = vi.hoisted(() => ({
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
}));

vi.mock("@/lib/api", () => ({
    default: { get: mocks.get, post: mocks.post, put: mocks.put, delete: mocks.delete },
}));

const mockGet = mocks.get;
const mockPost = mocks.post;
const mockDelete = mocks.delete;

const mockTeams = [
    { id: 1, name: "Flamengo", short_name: "FLA" },
    { id: 2, name: "Palmeiras", short_name: "PAL" },
];

describe("TeamsClient", () => {
    beforeEach(() => vi.clearAllMocks());

    it("shows loading state and then the teams list", async () => {
        mockGet.mockResolvedValue({ data: mockTeams });
        render(<TeamsClient />);

        expect(screen.getByText("Carregando...")).toBeInTheDocument();

        await waitFor(() => {
            expect(screen.getByText("Flamengo")).toBeInTheDocument();
            expect(screen.getByText("Palmeiras")).toBeInTheDocument();
        });
    });

    it("shows message when there are no registered teams", async () => {
        mockGet.mockResolvedValue({ data: [] });
        render(<TeamsClient />);

        await waitFor(() => {
            expect(screen.getByText("Nenhum time cadastrado.")).toBeInTheDocument();
        });
    });

    it("opens the creation dialog when clicking 'Novo Time'", async () => {
        const user = userEvent.setup();
        mockGet.mockResolvedValue({ data: mockTeams });
        render(<TeamsClient />);

        await waitFor(() => screen.getByText("Flamengo"));
        await user.click(screen.getByRole("button", { name: /novo time/i }));

        expect(screen.getByRole("dialog")).toBeInTheDocument();
        expect(screen.getByRole("heading", { name: /novo time/i })).toBeInTheDocument();
    });

    it("shows validation error when trying to create a team without a name", async () => {
        const user = userEvent.setup();
        mockGet.mockResolvedValue({ data: [] });
        render(<TeamsClient />);

        await waitFor(() => screen.getByRole("button", { name: /novo time/i }));
        await user.click(screen.getByRole("button", { name: /novo time/i }));
        await user.click(screen.getByRole("button", { name: /salvar/i }));

        await waitFor(() => {
            expect(screen.getByText("Nome obrigatório")).toBeInTheDocument();
        });
    });

    it("creates a team successfully and shows a success toast", async () => {
        const user = userEvent.setup();
        mockGet.mockResolvedValue({ data: [] });
        mockPost.mockResolvedValue({ data: { id: 3, name: "Corinthians", short_name: "COR" } });
        render(<TeamsClient />);

        await waitFor(() => screen.getByRole("button", { name: /novo time/i }));
        await user.click(screen.getByRole("button", { name: /novo time/i }));
        await user.type(screen.getByLabelText(/nome/i), "Corinthians");
        await user.type(screen.getByLabelText(/sigla/i), "COR");
        await user.click(screen.getByRole("button", { name: /salvar/i }));

        await waitFor(() => {
            expect(mockPost).toHaveBeenCalledWith("/admin/teams", {
                name: "Corinthians",
                short_name: "COR",
            });
            expect(toast.success).toHaveBeenCalledWith("Time criado.");
        });
    });

    it("shows error toast when API fails to load teams", async () => {
        mockGet.mockRejectedValue(new Error("Erro"));
        render(<TeamsClient />);

        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith("Erro ao carregar times.");
        });
    });

    it("deletes a team after confirmation", async () => {
        const user = userEvent.setup();
        vi.stubGlobal("confirm", vi.fn().mockReturnValue(true));
        mockGet.mockResolvedValue({ data: mockTeams });
        mockDelete.mockResolvedValue({});
        render(<TeamsClient />);

        await waitFor(() => screen.getByText("Flamengo"));
        const deleteButtons = screen.getAllByRole("button", { name: /excluir/i });
        await user.click(deleteButtons[0]);

        await waitFor(() => {
            expect(mockDelete).toHaveBeenCalledWith("/admin/teams/1");
            expect(toast.success).toHaveBeenCalledWith("Time excluído.");
        });
    });

    it("does not delete the team if the user cancels the confirmation", async () => {
        const user = userEvent.setup();
        vi.stubGlobal("confirm", vi.fn().mockReturnValue(false));
        mockGet.mockResolvedValue({ data: mockTeams });
        render(<TeamsClient />);

        await waitFor(() => screen.getByText("Flamengo"));
        const deleteButtons = screen.getAllByRole("button", { name: /excluir/i });
        await user.click(deleteButtons[0]);

        expect(mockDelete).not.toHaveBeenCalled();
    });
});
