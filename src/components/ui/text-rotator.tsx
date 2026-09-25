"use client";

import { useEffect, useState } from "react";

interface TextRotatorProps {
  words: string[];
  typingSpeed?: number;
  deletingSpeed?: number;
  delayBetweenWords?: number;
  className?: string;
}

export function TextRotator({
  words,
  typingSpeed = 100,
  deletingSpeed = 50,
  delayBetweenWords = 2500,
  className = "",
}: TextRotatorProps) {
  const [index, setIndex] = useState(0);
  const [text, setText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    const currentWord = words[index];

    if (isDeleting) {
      // Deleting
      if (text === "") {
        setIsDeleting(false);
        setIndex((prev) => (prev + 1) % words.length);
      } else {
        timer = setTimeout(() => {
          setText(text.slice(0, -1));
        }, deletingSpeed);
      }
    } else {
      // Typing
      if (text === currentWord) {
        timer = setTimeout(() => {
          setIsDeleting(true);
        }, delayBetweenWords);
      } else {
        timer = setTimeout(() => {
          setText(currentWord.slice(0, text.length + 1));
        }, typingSpeed);
      }
    }

    return () => clearTimeout(timer);
  }, [text, isDeleting, index, words, typingSpeed, deletingSpeed, delayBetweenWords]);

  return (
    <span className={`inline-block ${className}`}>
      {text}
      <span className="animate-pulse border-r-[3px] border-slate-900 ml-[2px] inline-block h-[0.85em] align-middle" style={{ animationDuration: '0.8s' }}></span>
    </span>
  );
}
