"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import Cookies from "js-cookie";
import api from "@/lib/api";
import { User } from "@/types";
import { buttonVariants } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
    const pathname = usePathname();
    const isActive = pathname === href;

    return (
        <Link
            href={href}
            className={`text-sm transition-colors hover:text-foreground ${
                isActive ? "text-foreground font-medium" : "text-muted-foreground"
            }`}
        >
            {children}
        </Link>
    );
}

export default function Navbar() {
    const router = useRouter();
    const pathname = usePathname();
    const [user, setUser] = useState<User | null>(null);

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
    }, [pathname]);

    async function handleLogout() {
        try {
            await api.post("/logout");
        } catch {}
        Cookies.remove("token");
        Cookies.remove("user");
        setUser(null);
        router.push("/login");
    }

    return (
        <nav className="border-b bg-background">
            <div className="mx-auto max-w-5xl flex items-center justify-between h-14 px-4">
                <div className="flex items-center gap-6">
                    <Link href="/" className="font-bold text-lg">
                        Brasileirão
                    </Link>
                    <NavLink href="/">Classificação</NavLink>
                    {user?.role === "admin" && (
                        <>
                            <NavLink href="/admin/teams">Times</NavLink>
                            <NavLink href="/admin/games">Jogos</NavLink>
                        </>
                    )}
                </div>

                <div className="flex items-center gap-4">
                    {user ? (
                        <DropdownMenu>
                            <DropdownMenuTrigger className={buttonVariants({ variant: "ghost", size: "sm" })}>
                                {user.name}
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => router.push("/profile")}>
                                    Perfil
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                    variant="destructive"
                                    onClick={handleLogout}
                                >
                                    Sair
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    ) : (
                        <div className="flex gap-2">
                            <Link href="/login" className={buttonVariants({ variant: "outline", size: "sm" })}>
                                Login
                            </Link>
                            <Link href="/register" className={buttonVariants({ size: "sm" })}>
                                Registrar
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </nav>
    );
}
