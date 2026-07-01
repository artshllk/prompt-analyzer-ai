"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import type { UsageInfo } from "@/types";
import { createContext, useContext, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import { UpgradeButton } from "./UpgradeButton";
import { SidebarExtensionPromo } from "./SidebarExtensionPromo";

interface AuthUser {
  email: string | null;
  fullName: string | null;
  tier: string | null;
}

const AuthContext = createContext<AuthUser | null>(null);

function useAuthUser() {
  return useContext(AuthContext);
}

function normalizeSupabaseUser(
  user: User | null,
  profile: { full_name: string | null; tier: string | null } | null,
): AuthUser | null {
  if (!user && !profile) return null;

  const fullName =
    profile?.full_name ||
    (typeof (user?.user_metadata as any)?.full_name === "string"
      ? (user?.user_metadata as any).full_name
      : null);

  return {
    email: user?.email ?? null,
    fullName,
    tier: profile?.tier ?? null,
  };
}

function getInitials(value: string | null | undefined) {
  if (!value) return "";
  const cleaned = value.trim();
  const source = cleaned.includes("@") ? cleaned.split("@")[0] : cleaned;
  const parts = source.split(/[^A-Za-z0-9]+/).filter(Boolean);

  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  }

  return source.slice(0, 1).toUpperCase();
}

function AuthProvider({ children }: { children: React.ReactNode }) {
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    let mounted = true;
    const supabase = createClient();

    async function fetchUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!mounted || !user) {
        if (mounted) setAuthUser(null);
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name,tier")
        .eq("id", user.id)
        .single();

      if (!mounted) return;
      setAuthUser(normalizeSupabaseUser(user, profile ?? null));
    }

    fetchUser();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <AuthContext.Provider value={authUser}>{children}</AuthContext.Provider>
  );
}

function SidebarProfile() {
  const authUser = useAuthUser();
  if (!authUser) return null;

  const initials = getInitials(authUser.fullName ?? authUser.email);
  const isFree = authUser.tier === "free";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="mt-auto px-4 pb-6 pt-4 space-y-3"
      style={{ borderTop: "1px solid var(--color-rule)" }}
    >
      {/* 1. Upgrade button gets its own full-width row if present */}
      {isFree && (
        <UpgradeButton className="w-full flex items-center justify-center text-[10px] font-bold tracking-wider uppercase py-2 rounded-full border border-[#FFFFFF26] text-(--color-paper-mute) transition-all hover:bg-white hover:text-black">
          Upgrade to Pro
        </UpgradeButton>
      )}

      {/* 2. Manage account stays pinned to the bottom left */}
      <Link href="/settings" className="flex items-center gap-3 group">
        <div
          className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[13px] font-medium transition-transform group-hover:scale-105"
          style={{
            background: "rgba(255, 255, 255, 0.08)",
            color: "var(--color-paper)",
            border: "1px solid rgba(255, 255, 255, 0.04)",
          }}
        >
          {initials}

          <span
            className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-black"
            style={{ background: "var(--color-accent)" }}
          />
        </div>
        <p
          className="text-[13px] font-medium transition-colors group-hover:text-white"
          style={{ color: "var(--color-paper)" }}
        >
          Manage account
        </p>
      </Link>
    </motion.div>
  );
}

// Settings is a regular nav item - the previous footer block (Settings +
// Sign out) read as a generic dashboard template. Sign out now lives on
// the Settings page itself, where account actions belong.
const NAV_ITEMS: { href: string; label: string; isPro?: boolean }[] = [
  { href: "/playground", label: "Playground" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/history", label: "History" },
  { href: "/insights", label: "Insights", isPro: true },
  { href: "/detector", label: "Detector" },
  { href: "/extension", label: "Extension" },
];

interface AppShellProps {
  children: React.ReactNode;
  // Kept on the prop type for compatibility with existing callers; unused for now
  // since the sidebar no longer renders a usage meter (limits surface contextually).
  usage?: UsageInfo;
}

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close mobile drawer on navigation
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Lock body scroll when drawer is open on mobile
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  return (
    <div
      className="flex min-h-screen relative"
      style={{ background: "var(--color-ink)" }}
    >
      {/* Mobile top bar */}
      <header
        className="md:hidden fixed top-0 left-0 right-0 z-30 flex items-center justify-between px-5 py-3.5"
        style={{
          background: "rgba(14,14,16,0.85)",
          backdropFilter: "blur(8px)",
          borderBottom: "1px solid var(--color-rule)",
        }}
      >
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <Image
            src="/logo.png"
            alt="Deepclario"
            width={26}
            height={26}
            priority
          />
          <span
            className="text-[15px] tracking-tight"
            style={{ color: "var(--color-paper)", fontWeight: 500 }}
          >
            Deepclario
          </span>
        </Link>
        <button
          onClick={() => setMobileOpen((o) => !o)}
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
          aria-expanded={mobileOpen}
          className="p-2 -mr-2 btn-icon"
        >
          {mobileOpen ? (
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path
                d="M5 5L15 15M15 5L5 15"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path
                d="M3 6H17M3 14H17"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          )}
        </button>
      </header>

      {/* Mobile backdrop */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            className="md:hidden fixed inset-0 z-30"
            style={{ background: "rgba(0,0,0,0.6)" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setMobileOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside
        className={`
          fixed md:sticky md:top-0 z-40 md:z-auto
          w-64 md:w-60 shrink-0
          h-screen md:h-screen
          flex flex-col
          transition-transform duration-300 ease-out
          ${mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
        `}
        style={{
          background: "var(--color-ink)",
          borderRight: "1px solid var(--color-rule)",
        }}
      >
        {/* Logo (desktop only - mobile uses top bar).
            No bottom border: the sidebar reads as one continuous
            surface from logo to nav, not as a stacked template. */}
        <div className="hidden md:block px-6 pt-7 pb-8">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2.5 group"
          >
            <Image
              src="/logo.png"
              alt="Deepclario"
              width={30}
              height={30}
              priority
            />
            <span
              className="text-[14.5px] tracking-tight transition-colors"
              style={{ color: "var(--color-paper)", fontWeight: 500 }}
            >
              Deepclario
            </span>
          </Link>
        </div>

        {/* Spacer for mobile (top bar height) */}
        <div className="md:hidden h-16" />

        {/* Nav. Roomier vertical rhythm and an accent-blue active
            indicator make the active item feel intentional rather
            than the default "highlighted row" of a template. */}
        <nav className="flex-1 px-3 pb-6">
          <ul className="space-y-0.5">
            {NAV_ITEMS.map((item) => {
              const isActive = pathname.startsWith(item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="relative flex items-center justify-between gap-3 pl-5 pr-3 py-2.5 text-[14px] nav-item-hover"
                    style={{
                      color: isActive
                        ? "var(--color-paper)"
                        : "var(--color-paper-mute)",
                      fontWeight: isActive ? 500 : 400,
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive)
                        e.currentTarget.style.color = "var(--color-paper)";
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive)
                        e.currentTarget.style.color = "var(--color-paper-mute)";
                    }}
                  >
                    {isActive && (
                      <span
                        aria-hidden
                        className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 rounded-full"
                        style={{ background: "var(--color-accent)" }}
                      />
                    )}
                    <span>{item.label}</span>
                    {item.isPro && (
                      <span
                        className="text-[10px] tracking-[0.16em] uppercase"
                        style={{ color: "var(--color-paper-mute)" }}
                      >
                        Pro
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Extension promo - persistent reminder for signed-in users.
            Hides on /extension and after dismissal. */}
        <SidebarExtensionPromo />

        <AuthProvider>
          <SidebarProfile />
        </AuthProvider>
      </aside>

      {/* Main content */}
      <main className="flex-1 min-w-0 overflow-y-auto">
        {/* Push down on mobile to clear the top bar */}
        <div className="md:hidden h-16" />
        {children}
      </main>
    </div>
  );
}
