import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi, describe, it, expect, beforeEach } from "vitest";
import { LoginForm } from "@/components/login-form";
import Cookies from "js-cookie";

const mocks = vi.hoisted(() => ({
    post: vi.fn(),
    push: vi.fn(),
}));

vi.mock("@/lib/api", () => ({ default: { post: mocks.post } }));
vi.mock("next/navigation", () => ({
    useRouter: () => ({ push: mocks.push }),
    usePathname: () => "/login",
}));

describe("LoginForm", () => {
    beforeEach(() => vi.clearAllMocks());

    it("renders email and password fields", () => {
        render(<LoginForm />);
        expect(screen.getByLabelText(/e-mail/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/senha/i)).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /entrar/i })).toBeInTheDocument();
    });

    it("shows validation error for invalid email", async () => {
        const user = userEvent.setup();
        render(<LoginForm />);

        await user.type(screen.getByLabelText(/e-mail/i), "email-invalido");
        await user.click(screen.getByRole("button", { name: /entrar/i }));

        await waitFor(() => {
            expect(screen.getByText("E-mail inválido")).toBeInTheDocument();
        });
    });

    it("shows validation error when password is empty", async () => {
        const user = userEvent.setup();
        render(<LoginForm />);

        await user.type(screen.getByLabelText(/e-mail/i), "user@test.com");
        await user.click(screen.getByRole("button", { name: /entrar/i }));

        await waitFor(() => {
            expect(screen.getByText("Senha obrigatória")).toBeInTheDocument();
        });
    });

    it("redirects admin to /admin/games after login", async () => {
        const user = userEvent.setup();
        mocks.post.mockResolvedValue({
            data: {
                token: "fake-token",
                user: { id: 1, name: "Admin", email: "admin@test.com", role: "admin" },
            },
        });

        render(<LoginForm />);
        await user.type(screen.getByLabelText(/e-mail/i), "admin@test.com");
        await user.type(screen.getByLabelText(/senha/i), "password@123");
        await user.click(screen.getByRole("button", { name: /entrar/i }));

        await waitFor(() => {
            expect(Cookies.set).toHaveBeenCalledWith("token", "fake-token", { expires: 7 });
            expect(mocks.push).toHaveBeenCalledWith("/admin/games");
        });
    });

    it("redirects regular user to / after login", async () => {
        const user = userEvent.setup();
        mocks.post.mockResolvedValue({
            data: {
                token: "fake-token",
                user: { id: 2, name: "User", email: "user@test.com", role: "user" },
            },
        });

        render(<LoginForm />);
        await user.type(screen.getByLabelText(/e-mail/i), "user@test.com");
        await user.type(screen.getByLabelText(/senha/i), "password@123");
        await user.click(screen.getByRole("button", { name: /entrar/i }));

        await waitFor(() => {
            expect(mocks.push).toHaveBeenCalledWith("/");
        });
    });

    it("shows API error message when login fails", async () => {
        const user = userEvent.setup();
        mocks.post.mockRejectedValue({ message: "Credenciais inválidas." });

        render(<LoginForm />);
        await user.type(screen.getByLabelText(/e-mail/i), "user@test.com");
        await user.type(screen.getByLabelText(/senha/i), "wrongpassword");
        await user.click(screen.getByRole("button", { name: /entrar/i }));

        await waitFor(() => {
            expect(screen.getByText("Credenciais inválidas.")).toBeInTheDocument();
        });
    });
});
