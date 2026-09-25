"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { ReactNode, useRef } from "react";

interface ParallaxElementProps {
  children: ReactNode;
  offset?: number;
  className?: string;
}

export function ParallaxElement({ children, offset = 50, className = "" }: ParallaxElementProps) {
  const ref = useRef<HTMLDivElement>(null);
  
  // Track scroll progress relative to this element
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"]
  });
  
  // Transform scroll progress to Y translation
  const y = useTransform(scrollYProgress, [0, 1], [-offset, offset]);

  return (
    <motion.div ref={ref} style={{ y }} className={className}>
      {children}
    </motion.div>
  );
}
