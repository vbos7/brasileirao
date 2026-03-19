"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import Cookies from "js-cookie";
import api from "@/lib/api";
import { User } from "@/types";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";
import { LogOut, Settings, Menu, BookOpen } from "lucide-react";

const AUTH_ROUTES = ["/login", "/register"];

export default function Navbar() {
    const router = useRouter();
    const pathname = usePathname();
    const [user, setUser] = useState<User | null>(null);
    const [sidebarOpen, setSidebarOpen] = useState(false);

    useEffect(() => {
        function syncUser() {
            try {
                const stored = Cookies.get("user");
                setUser(stored ? JSON.parse(stored) : null);
            } catch {
                Cookies.remove("user");
                setUser(null);
            }
        }

        syncUser();
        window.addEventListener("user-updated", syncUser);
        return () => window.removeEventListener("user-updated", syncUser);
    }, []);

    if (AUTH_ROUTES.includes(pathname)) return null;

    async function handleLogout() {
        try {
            await api.post("/logout");
        } catch {}
        Cookies.remove("token");
        Cookies.remove("user");
        setUser(null);
        router.push("/login");
    }

    function isActive(path: string) {
        return pathname === path;
    }

    const linkClass = (path: string) =>
        `flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground ${
            isActive(path) ? "bg-accent/50 text-accent-foreground" : "text-muted-foreground"
        }`;

    const mobileLinkClass = (path: string) =>
        `flex items-center gap-3 rounded-md px-3 py-3 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground ${
            isActive(path) ? "bg-accent text-accent-foreground" : "text-foreground"
        }`;

    function NavLinks({ mobile = false }: { mobile?: boolean }) {
        const cls = mobile ? mobileLinkClass : linkClass;
        const onClick = mobile ? () => setSidebarOpen(false) : undefined;

        return (
            <>
                <Link href="/" className={cls("/")} onClick={onClick}>
                    Classificação
                </Link>
                {user?.role === "admin" && (
                    <>
                        <Link href="/admin/teams" className={cls("/admin/teams")} onClick={onClick}>
                            Times
                        </Link>
                        <Link href="/admin/games" className={cls("/admin/games")} onClick={onClick}>
                            Jogos
                        </Link>
                    </>
                )}
            </>
        );
    }

    return (
        <header className="bg-card sticky top-0 z-50 border-b">
            <div className="mx-auto flex max-w-5xl items-center justify-between gap-6 px-4 py-3 sm:px-6">
                {/* Logo + mobile menu trigger */}
                <div className="flex items-center gap-4">
                    <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
                        <SheetTrigger asChild>
                            <Button
                                variant="outline"
                                size="icon"
                                className="inline-flex xl:hidden"
                            >
                                <Menu className="size-4" />
                                <span className="sr-only">Menu</span>
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="left" className="w-64 p-0">
                            <SheetHeader className="border-b px-6 py-4">
                                <SheetTitle className="flex items-center gap-2 text-left">
                                    <img src="/logo.png" alt="Brasileirão" className="size-5" />
                                    Brasileirão
                                </SheetTitle>
                            </SheetHeader>
                            <nav className="flex flex-col gap-1 p-4">
                                <NavLinks mobile />
                            </nav>
                        </SheetContent>
                    </Sheet>

                    <Link href="/" className="flex items-center gap-2">
                        <img src="/logo.png" alt="Brasileirão" className="size-6" />
                        <span className="hidden text-xl font-semibold sm:block">Brasileirão</span>
                    </Link>
                </div>

                {/* Nav desktop */}
                <nav className="hidden flex-1 items-center gap-1 xl:flex">
                    <NavLinks />
                </nav>

                {/* Right side */}
                <div className="flex items-center gap-1.5">
                    {user ? (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-full p-0">
                                    <div className="flex size-9 items-center justify-center rounded-md bg-primary text-primary-foreground text-sm font-medium">
                                        {user.name.charAt(0).toUpperCase()}
                                    </div>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56">
                                <DropdownMenuLabel>
                                    <div className="flex flex-col">
                                        <span className="text-sm font-medium">{user.name}</span>
                                        <span className="text-xs text-muted-foreground">{user.email}</span>
                                    </div>
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => router.push("/profile")}>
                                    <Settings className="mr-2 size-4" />
                                    Meu Perfil
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => window.open(`${process.env.NEXT_PUBLIC_API_URL?.replace("/api", "") ?? "http://localhost:8000"}/api/documentation`, "_blank")}>
                                    <BookOpen className="mr-2 size-4" />
                                    Documentação
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                    onClick={handleLogout}
                                    className="text-destructive focus:text-destructive"
                                >
                                    <LogOut className="mr-2 size-4" />
                                    Sair
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    ) : (
                        <div className="flex items-center gap-2">
                            <Button variant="ghost" size="sm" asChild>
                                <Link href="/login">Login</Link>
                            </Button>
                            <Button size="sm" asChild>
                                <Link href="/register">Registrar</Link>
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}
