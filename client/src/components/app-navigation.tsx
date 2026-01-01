"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from "@/components/ui/navigation-menu";
import { cn } from "@/lib/utils";
import { clearAuth, getAuth } from "@/lib/auth-storage";
import { useEffect, useState } from "react";

const navItems = [
  { href: "/hotels", label: "Hotels" },
  { href: "/room-types", label: "Room Types" },
];

export function AppNavigation() {
  const pathname = usePathname();
  const [authed, setAuthed] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => {
      const session = getAuth();
      setAuthed(!!session?.token);
      setReady(true);
    });
    return () => cancelAnimationFrame(id);
  }, []);

  if (!ready || !authed) {
    return null;
  }

  return (
    <div className="border-b bg-background">
      <div className="mx-auto flex items-center px-4 py-3">
        <NavigationMenu viewport={true} className="flex-1 justify-end">
          <NavigationMenuList>
            {navItems.map((item) => {
              const active = pathname === item.href;
              return (
                <NavigationMenuItem key={item.href}>
                  <NavigationMenuLink asChild active={active}>
                    <Link
                      href={item.href}
                      className={cn(
                        "rounded-md px-3 py-2 text-sm font-medium transition-colors",
                        active
                          ? "bg-accent text-accent-foreground"
                          : "text-foreground/80 hover:bg-muted hover:text-foreground"
                      )}
                    >
                      {item.label}
                    </Link>
                  </NavigationMenuLink>
                </NavigationMenuItem>
              );
            })}
            {ready && authed ? (
              <NavigationMenuItem>
                <NavigationMenuLink asChild active={false}>
                  <button
                    onClick={() => {
                      clearAuth();
                      window.location.href = "/auth";
                    }}
                    className={cn(
                      "rounded-md px-3 py-2 text-sm font-medium transition-colors text-foreground/80 hover:bg-muted hover:text-foreground"
                    )}
                  >
                    Logout
                  </button>
                </NavigationMenuLink>
              </NavigationMenuItem>
            ) : null}
          </NavigationMenuList>
        </NavigationMenu>
      </div>
    </div>
  );
}
