"use client";

import Typewriter from "typewriter-effect";

interface TextRotatorProps {
  words: string[];
  typingSpeed?: number;
  deletingSpeed?: number;
  delayBetweenWords?: number;
  className?: string;
}

export function TextRotator({
  words,
  typingSpeed = 75,
  deletingSpeed = 50,
  delayBetweenWords = 2500,
  className = "",
}: TextRotatorProps) {
  return (
    <span className={`inline-block ${className}`}>
      <Typewriter
        options={{
          strings: words,
          autoStart: true,
          loop: true,
          delay: typingSpeed,
          deleteSpeed: deletingSpeed,
          cursor: "|",
          wrapperClassName: "Typewriter__wrapper text-slate-900", // Keep it black
          cursorClassName: "Typewriter__cursor animate-pulse text-slate-900 font-light",
        }}
      />
    </span>
  );
}
