"use client";

import React, { useRef } from "react";
import { motion, useInView } from "framer-motion";

interface FadeInViewProps {
  children: React.ReactNode;
  delay?: number;
  direction?: "up" | "down" | "left" | "right" | "none";
  className?: string;
  amount?: "some" | "all" | number;
}

export function FadeInView({
  children,
  delay = 0,
  direction = "up",
  className = "",
  amount = 0.3,
}: FadeInViewProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount });

  const getHiddenVariants = () => {
    switch (direction) {
      case "up": return { opacity: 0, y: 40 };
      case "down": return { opacity: 0, y: -40 };
      case "left": return { opacity: 0, x: 40 };
      case "right": return { opacity: 0, x: -40 };
      case "none": return { opacity: 0 };
    }
  };

  const getVisibleVariants = () => {
    switch (direction) {
      case "up":
      case "down": return { opacity: 1, y: 0 };
      case "left":
      case "right": return { opacity: 1, x: 0 };
      case "none": return { opacity: 1 };
    }
  };

  return (
    <motion.div
      ref={ref}
      initial={getHiddenVariants()}
      animate={isInView ? getVisibleVariants() : getHiddenVariants()}
      transition={{ duration: 0.6, delay: delay, ease: [0.21, 0.47, 0.32, 0.98] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
