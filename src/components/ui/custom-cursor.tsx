"use client";

import { useEffect, useState } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";

export function CustomCursor() {
  const [isVisible, setIsVisible] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  
  // Base position tracking
  const cursorX = useMotionValue(-100);
  const cursorY = useMotionValue(-100);

  // Position for the small dot (snaps faster/tighter to cursor)
  const dotSpringConfig = { damping: 25, stiffness: 300, mass: 0.5 };
  const cursorXSpringDot = useSpring(cursorX, dotSpringConfig);
  const cursorYSpringDot = useSpring(cursorY, dotSpringConfig);

  // Position for the outer ring (trails with noticeable lag/delay)
  const springConfig = { damping: 20, stiffness: 120, mass: 1.2 };
  const cursorXSpring = useSpring(cursorX, springConfig);
  const cursorYSpring = useSpring(cursorY, springConfig);

  useEffect(() => {
    // Only show on large desktop screens with a pointing device (mouse)
    const checkVisibility = () => {
      if (window.matchMedia("(min-width: 1024px) and (pointer: fine)").matches) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    checkVisibility();
    window.addEventListener("resize", checkVisibility);

    const moveCursor = (e: MouseEvent) => {
      cursorX.set(e.clientX);
      cursorY.set(e.clientY);
      
      // Check if hovering over clickable element
      const target = e.target as HTMLElement;
      const isClickable = target.closest('a, button, input, textarea, select, [role="button"]');
      setIsHovering(!!isClickable);
    };

    const handleMouseLeave = () => setIsVisible(false);
    const handleMouseEnter = () => setIsVisible(true);

    window.addEventListener("mousemove", moveCursor);
    document.documentElement.addEventListener("mouseleave", handleMouseLeave);
    document.documentElement.addEventListener("mouseenter", handleMouseEnter);

    return () => {
      window.removeEventListener("resize", checkVisibility);
      window.removeEventListener("mousemove", moveCursor);
      document.documentElement.removeEventListener("mouseleave", handleMouseLeave);
      document.documentElement.removeEventListener("mouseenter", handleMouseEnter);
    };
  }, [cursorX, cursorY]);

  if (!isVisible) return null;

  return (
    <>

      
      {/* Outer trailing circle */}
      <motion.div
        className="hidden lg:block fixed top-0 left-0 w-8 h-8 border-2 border-blue-500 rounded-full pointer-events-none z-[9999]"
        style={{
          x: cursorXSpring,
          y: cursorYSpring,
          translateX: "-50%",
          translateY: "-50%",
        }}
        animate={{
          scale: isHovering ? 1.5 : 1,
          opacity: isHovering ? 0.5 : 1,
          borderColor: isHovering ? '#2563EB' : '#3B82F6' // blue-600 vs blue-500
        }}
        transition={{ duration: 0.15 }}
      />
      
      {/* Inner dot */}
      <motion.div
        className="hidden lg:block fixed top-0 left-0 w-2.5 h-2.5 bg-blue-600 rounded-full pointer-events-none z-[10000]"
        style={{
          x: cursorXSpringDot,
          y: cursorYSpringDot,
          translateX: "-50%",
          translateY: "-50%",
        }}
        animate={{
          scale: isHovering ? 0.5 : 1
        }}
        transition={{ duration: 0.15 }}
      />
    </>
  );
}
