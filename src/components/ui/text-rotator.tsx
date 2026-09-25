"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

interface TextRotatorProps {
  words: string[];
  interval?: number;
  className?: string;
}

export function TextRotator({ words, interval = 3000, className = "" }: TextRotatorProps) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % words.length);
    }, interval);
    return () => clearInterval(timer);
  }, [words, interval]);

  return (
    <span className={`inline-grid ${className}`}>
      <AnimatePresence mode="popLayout">
        <motion.span
          key={index}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
          className="col-start-1 row-start-1"
        >
          {words[index]}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}
