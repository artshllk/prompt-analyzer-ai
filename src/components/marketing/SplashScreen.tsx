"use client";

import { useEffect, useLayoutEffect, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

/**
 * Home page splash: the same choreography as the post-signup WelcomeMoment
 * (ambient accent glow, logo resolving out of a blur, display-type wordmark),
 * but shown on every visit to `/` rather than once per user.
 *
 * `visible` starts true - not flipped on inside an effect - so the overlay
 * is there from the very first paint (including SSR). Flipping it on later
 * left a frame where the bare page showed before hydration caught up.
 * Reduced motion is turned off via useLayoutEffect, which runs before the
 * browser paints, so those users never see the overlay flash on either.
 */
export function SplashScreen() {
  const reduce = useReducedMotion();
  const [visible, setVisible] = useState(true);

  useLayoutEffect(() => {
    if (reduce) setVisible(false);
  }, [reduce]);

  useEffect(() => {
    if (reduce) return;
    const hide = setTimeout(() => setVisible(false), 2200);
    return () => clearTimeout(hide);
  }, [reduce]);

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
