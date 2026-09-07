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
import { PaddleProvider } from "@/components/PaddleProvider";

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

function SidebarProfile({ foundingLeft = 0 }: { foundingLeft?: number }) {
  const authUser = useAuthUser();
  const pathname = usePathname();
  const settingsActive = pathname.startsWith("/settings");
  if (!authUser) return null;

  const initials = getInitials(authUser.fullName ?? authUser.email);
  const isFree = authUser.tier === "free";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      /* Bottom-pinned, which is the convention in every app and where a hand
         goes looking. I moved this up to close what looked like a dead gap;
         that was wrong. The space between nav and account is normal, not a
         bug. */
      className="mt-auto px-2 pb-4 pt-3 space-y-3"
      style={{ borderTop: "1px solid var(--rule)" }}
    >
      {/* 1. Upgrade button gets its own full-width row if present */}
      {isFree && (
        <UpgradeButton
          foundingLeft={foundingLeft}
          className="w-full flex items-center justify-center text-[10px] font-bold tracking-wider uppercase py-2 rounded-full btn-brand transition-all"
        >
          Upgrade to Pro
        </UpgradeButton>
      )}

      {/*
        /settings is reachable only through here, so it needs an active state
        like every other destination. Without one the sidebar showed nothing
        highlighted on the page you were standing on.

        THE RED DOT IS GONE. It was unconditional: no state behind it, nothing
        it could ever mean. A badge that is always on teaches people to ignore
        badges. Its `border-black` ring was a leftover from the dark theme too.
      */}
      <Link
        href="/settings"
        aria-current={settingsActive ? "page" : undefined}
        className="relative flex items-center gap-3 rounded-lg px-3 py-2 transition-colors"
        style={{
          background: settingsActive ? "var(--rule)" : "transparent",
        }}
        onMouseEnter={(e) => {
          if (!settingsActive) e.currentTarget.style.background = "var(--sidebar-hover)";
        }}
        onMouseLeave={(e) => {
          if (!settingsActive) e.currentTarget.style.background = "transparent";
        }}
      >
        {settingsActive && (
          <span
            aria-hidden
            className="absolute left-0 top-1/2 -translate-y-1/2 -ml-2 w-[3px] h-5 rounded-full"
            style={{ background: "var(--brand)" }}
          />
        )}
        <div
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[13px] font-medium"
          style={{
            background: "var(--card)",
            color: "var(--ink)",
            border: "1px solid var(--rule)",
          }}
        >
          {initials}
        </div>
        <p
          className="text-[15px]"
          style={{
            color: settingsActive ? "var(--ink)" : "var(--ink-soft)",
            fontWeight: settingsActive ? 500 : 400,
          }}
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
/**
 * THE IMPROVER IS IN THE SIDEBAR BECAUSE PRO IS CHARGED FOR IT.
 *
 * The marketing navbar deliberately keeps one product forward, and that is
 * still right: a first-time visitor should see one thing. This is the other
 * side of the sign-up, and the rule is different. Pro includes 30 prompt
 * improvements a month and the subscription is priced with them in it, so a
 * paying account that cannot find the tool has been sold something invisible.
 *
 * That is the same class of problem as copy promising a number the server
 * does not enforce, pointed the other way: here the server enforces an
 * allowance for a feature the interface never mentions.
 */
const IMPROVER_ITEM = { href: "/prompt-improver", label: "Prompt improver" };
const HISTORY_ITEM = { href: "/history", label: "History" };

interface AppShellProps {
  children: React.ReactNode;
  /** True when the user has prompt-improver sessions stored. Hides History otherwise. */
  hasHistory?: boolean;
  /** Founding seats left. Passed to the upgrade dialog so it shows a real price. */
  foundingLeft?: number;
  // Kept on the prop type for compatibility with existing callers; unused for now
  // since the sidebar no longer renders a usage meter (limits surface contextually).
  usage?: UsageInfo;
}

export function AppShell({ children, hasHistory, foundingLeft = 0 }: AppShellProps) {
  const pathname = usePathname();

  // History only exists for people who have some. Everyone gets Check.
  // Check first because it is the product. History last because it only
  // exists for people who have some.
  const navItems = hasHistory
    ? [CHECK_ITEM, DETECTOR_ITEM, IMPROVER_ITEM, HISTORY_ITEM]
    : [CHECK_ITEM, DETECTOR_ITEM, IMPROVER_ITEM];
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
    <PaddleProvider>
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
        /* Its own ground. It was the same --paper as the content with a
           hairline between, so it read as text floating on the left rather
           than a region. */
        style={{
          background: "var(--sidebar)",
          borderRight: "1px solid var(--rule)",
        }}
      >
        {/* A rule under the logo. Without one it merged into the first nav
            item and the wordmark read as another row. */}
        <div
          className="hidden md:block px-5 pt-6 pb-5 mb-3"
          style={{ borderBottom: "1px solid var(--rule)" }}
        >
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
        <nav className="px-2 pb-5">
          <ul className="space-y-1">
            {navItems.map((item) => {
              const isActive = pathname.startsWith(item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    /* A FULL-WIDTH FILLED ROW, because that is what reads as
                       clickable. A colour change on bare text does not, which
                       is what this was.

                       Measured on --sidebar #EAE8E1: --ink-soft 4.72:1 and
                       --ink 15.13:1, both AA at 15px. Hover moves the text to
                       --ink as well as adding the fill, because --ink-soft on
                       --sidebar-hover is 4.34:1 and would have dropped the nav
                       below AA exactly when someone is looking at it. */
                    className="relative flex items-center gap-3 rounded-lg px-3 py-2 text-[15px] transition-colors"
                    style={{
                      color: isActive ? "var(--ink)" : "var(--ink-soft)",
                      fontWeight: isActive ? 500 : 400,
                      background: isActive ? "var(--rule)" : "transparent",
                    }}
                    onMouseEnter={(e) => {
                      if (isActive) return;
                      e.currentTarget.style.background = "var(--sidebar-hover)";
                      e.currentTarget.style.color = "var(--ink)";
                    }}
                    onMouseLeave={(e) => {
                      if (isActive) return;
                      e.currentTarget.style.background = "transparent";
                      e.currentTarget.style.color = "var(--ink-soft)";
                    }}
                  >
                    {isActive && (
                      <span
                        aria-hidden
                        className="absolute left-0 top-1/2 -translate-y-1/2 -ml-2 w-[3px] h-5 rounded-full"
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
          <SidebarProfile foundingLeft={foundingLeft} />
        </AuthProvider>
      </aside>

      {/* Main content */}
      <main className="flex-1 min-w-0 overflow-y-auto">
        {/* Push down on mobile to clear the top bar */}
        <div className="md:hidden h-16" />
        {children}
      </main>
    </div>
    </PaddleProvider>
  );
}
