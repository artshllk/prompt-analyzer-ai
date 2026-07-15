"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";

/**
 * Home page splash: the same choreography as the post-signup WelcomeMoment
 * (ambient accent glow, logo resolving out of a blur, display-type wordmark),
 * shown when someone lands on `/`, but at most once per 10 minutes so a
 * returning visitor within the window skips straight to the page.
 *
 * The cooldown and reduced-motion decisions live in a blocking inline
 * script in the root layout, NOT here: it runs before first paint and, when
 * the splash should be suppressed, hides the `data-dc-splash` element via an
 * injected style so it never paints. Doing it in React instead left the
 * server-rendered overlay painting for a frame on every refresh. This
 * component just renders the overlay and auto-dismisses it; when the script
 * has hidden it, the timer below flips state harmlessly behind display:none.
 */
export function SplashScreen() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const hide = setTimeout(() => setVisible(false), 2200);
    return () => clearTimeout(hide);
  }, []);

  useEffect(() => {
    if (!visible) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setVisible(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [visible]);

  return (
    // initial={false}: the overlay is already in the tree on first mount,
    // so it should render at full opacity immediately rather than fading
    // in from 0 - a fade-in here is what let the home page show through
    // for a frame before the overlay caught up. Only the exit (dismiss)
    // still animates.
    <AnimatePresence initial={false}>
      {visible && (
        <motion.div
          role="status"
          aria-label="Deepclario"
          data-dc-splash
          className="fixed inset-0 z-100 flex items-center justify-center cursor-pointer"
          style={{ background: "var(--color-ink)" }}
          exit={{
            opacity: 0,
            transition: { duration: 0.5, ease: "easeInOut" },
          }}
          onClick={() => setVisible(false)}
        >
          {/* Ambient accent glow behind the mark */}
          <motion.div
            aria-hidden="true"
            className="absolute pointer-events-none"
            style={{
              width: 560,
              height: 560,
              borderRadius: "50%",
              background:
                "radial-gradient(circle, var(--color-accent-glow), transparent 65%)",
              filter: "blur(40px)",
            }}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
          />

          <div className="relative flex flex-col items-center gap-6 px-6 text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.85, filter: "blur(6px)" }}
              animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            >
              <Image src="/logo.png" alt="" width={48} height={48} priority />
            </motion.div>
            <motion.p
              className="display text-4xl md:text-5xl"
              style={{ color: "var(--color-paper)" }}
              initial={{ opacity: 0, y: 12, filter: "blur(8px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{
                duration: 0.7,
                delay: 0.35,
                ease: [0.16, 1, 0.3, 1],
              }}
            >
              Deepclario
            </motion.p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
