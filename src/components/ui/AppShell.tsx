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
      /* Directly under the nav with a rule, not pushed to the bottom by
         mt-auto. The gap that created was dead space, and a sidebar with four
         items does not need its account block a screen away from them. */
      className="px-4 pb-6 pt-4 space-y-3"
      style={{ borderTop: "1px solid var(--rule)" }}
    >
      {/* 1. Upgrade button gets its own full-width row if present */}
      {isFree && (
        <UpgradeButton className="w-full flex items-center justify-center text-[10px] font-bold tracking-wider uppercase py-2 rounded-full btn-brand transition-all">
          Upgrade to Pro
        </UpgradeButton>
      )}

      {/* 2. Manage account stays pinned to the bottom left */}
      <Link href="/settings" className="flex items-center gap-3 group">
        <div
          className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[13px] font-medium transition-transform group-hover:scale-105"
          style={{
            background: "var(--card)",
            color: "var(--color-paper)",
            border: "1px solid var(--rule)",
          }}
        >
          {initials}

          <span
            className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-black"
            style={{ background: "var(--color-accent)" }}
          />
        </div>
        <p
          className="text-[15px] font-medium transition-colors group-hover:text-[color:var(--ink)]"
          style={{ color: "var(--color-paper)" }}
        >
          Manage account
        </p>
      </Link>
    </motion.div>
  );
}

/**
 * ONE THING, BECAUSE THERE IS ONE THING.
 *
 * This read Dashboard, History, Extension, and contained no way to reach the
 * checker at all. Somebody signed up to get more checks and then could not
 * find the checker, which is as broken as navigation gets.
 *
 * Dashboard is gone. Once the checks-left count sits on the checker itself, a
 * page whose only job is to show that count is not a page.
 *
 * Extension is gone from here. It is frozen, and it was sitting above a live
 * product that was not listed.
 *
 * History is improver-only and appears only for people who have some. Anyone
 * with stored work keeps both the item and the work; a new user gets a sidebar
 * with one thing on it. There is deliberately no CHECK history: the FAQ says
 * "we save nothing" about pasted text, and that promise is worth more than the
 * feature.
 */
const CHECK_ITEM = { href: "/check", label: "Check" };
/**
 * The detector is in the sidebar even though the landing page gives it one
 * line. That is not a contradiction: the landing page sells one product, and
 * the app navigation exposes everything the account has quota for. A signed-in
 * user has a detector allowance tied to their account, so they need to be able
 * to reach it, and a sidebar that omits the page you are standing on is worse
 * than no sidebar.
 */
const DETECTOR_ITEM = { href: "/detector", label: "Detector" };
const HISTORY_ITEM = { href: "/history", label: "History" };

interface AppShellProps {
  children: React.ReactNode;
  /** True when the user has prompt-improver sessions stored. Hides History otherwise. */
  hasHistory?: boolean;
  // Kept on the prop type for compatibility with existing callers; unused for now
  // since the sidebar no longer renders a usage meter (limits surface contextually).
  usage?: UsageInfo;
}

export function AppShell({ children, hasHistory }: AppShellProps) {
  const pathname = usePathname();

  // History only exists for people who have some. Everyone gets Check.
  const navItems = hasHistory
    ? [CHECK_ITEM, DETECTOR_ITEM, HISTORY_ITEM]
    : [CHECK_ITEM, DETECTOR_ITEM];
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
          background: "rgba(21,19,15,0.45)",
          backdropFilter: "blur(8px)",
          borderBottom: "1px solid var(--color-rule)",
        }}
      >
        <Link href="/check" className="flex items-center gap-2.5">
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
            href="/check"
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
        <nav className="px-3 pb-5">
          <ul className="space-y-0.5">
            {navItems.map((item) => {
              const isActive = pathname.startsWith(item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    /* 15px, and both states measured on the sidebar's ground
                       (--paper #F1F0EA): inactive --ink-soft is 5.07:1 and
                       active --ink is 16.25:1, so both pass AA at this size
                       and no new colour was needed. The active state read
                       weak before because both sat at 14px with a 100-weight
                       gap, not because the colours were wrong. --brand is
                       4.20:1 here and stays the bar, never a label. */
                    className="relative flex items-center justify-between gap-3 pl-5 pr-3 py-2.5 text-[15px] nav-item-hover"
                    style={{
                      color: isActive ? "var(--ink)" : "var(--ink-soft)",
                      fontWeight: isActive ? 500 : 400,
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) e.currentTarget.style.color = "var(--ink)";
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) e.currentTarget.style.color = "var(--ink-soft)";
                    }}
                  >
                    {isActive && (
                      <span
                        aria-hidden
                        className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-full"
                        style={{ background: "var(--color-accent)" }}
                      />
                    )}
                    <span>{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

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
