'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useMotionValue, useSpring, useTransform } from 'framer-motion';
import type { OptimizeRequest, OptimizeResult } from '@/types';
import { generateId } from '@/lib/utils';

// ══════════════════════════════════════════════════════════
// useTypewriter — cycles through strings with type/erase
// ══════════════════════════════════════════════════════════
export function useTypewriter(options: {
  strings: string[];
  typingSpeed?: number;
  deletingSpeed?: number;
  pauseDuration?: number;
  loop?: boolean;
}) {
  const {
    strings,
    typingSpeed   = 60,
    deletingSpeed = 30,
    pauseDuration = 2000,
    loop          = true,
  } = options;

  const [displayText, setDisplayText] = useState('');
  const [isTyping, setIsTyping]       = useState(true);
  const [stringIndex, setStringIndex] = useState(0);
  const [charIndex, setCharIndex]     = useState(0);
  const [isPausing, setIsPausing]     = useState(false);

  useEffect(() => {
    if (strings.length === 0) return;
    const current = strings[stringIndex];

    if (isPausing) {
      const timer = setTimeout(() => setIsPausing(false), pauseDuration);
      return () => clearTimeout(timer);
    }

    if (isTyping) {
      if (charIndex < current.length) {
        const timer = setTimeout(() => {
          setDisplayText(current.slice(0, charIndex + 1));
          setCharIndex(c => c + 1);
        }, typingSpeed);
        return () => clearTimeout(timer);
      } else {
        setIsPausing(true);
        setIsTyping(false);
      }
    } else {
      if (charIndex > 0) {
        const timer = setTimeout(() => {
          setDisplayText(current.slice(0, charIndex - 1));
          setCharIndex(c => c - 1);
        }, deletingSpeed);
        return () => clearTimeout(timer);
      } else {
        if (loop || stringIndex < strings.length - 1) {
          setStringIndex(i => (i + 1) % strings.length);
          setIsTyping(true);
        }
      }
    }
  }, [charIndex, isTyping, isPausing, stringIndex, strings, typingSpeed, deletingSpeed, pauseDuration, loop]);

  return { displayText, isTyping };
}

// ══════════════════════════════════════════════════════════
// useClipboard — copy text with 2s feedback
// ══════════════════════════════════════════════════════════
export function useClipboard(resetDelay = 2000) {
  const [copied, setCopied] = useState(false);
  const [error, setError]   = useState<string | null>(null);

  const copy = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setError(null);
      setTimeout(() => setCopied(false), resetDelay);
    } catch {
      setError('Clipboard access denied');
      setTimeout(() => setError(null), 3000);
    }
  }, [resetDelay]);

  return { copy, copied, error };
}

// ══════════════════════════════════════════════════════════
// useMouseParallax — mouse-relative motion values
// ══════════════════════════════════════════════════════════
export function useMouseParallax(strength = 20) {
  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);

  const x        = useSpring(rawX, { stiffness: 100, damping: 30 });
  const y        = useSpring(rawY, { stiffness: 100, damping: 30 });
  const rotateX  = useTransform(y, [-strength, strength], [5, -5]);
  const rotateY  = useTransform(x, [-strength, strength], [-5, 5]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const rect   = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top  + rect.height / 2;
    rawX.set(((e.clientX - centerX) / rect.width)  * strength);
    rawY.set(((e.clientY - centerY) / rect.height) * strength);
  }, [rawX, rawY, strength]);

  const handleMouseLeave = useCallback(() => {
    rawX.set(0);
    rawY.set(0);
  }, [rawX, rawY]);

  return { x, y, rotateX, rotateY, handleMouseMove, handleMouseLeave };
}

// ══════════════════════════════════════════════════════════
// useScrollAnimation — Framer Motion scroll variants
// ══════════════════════════════════════════════════════════
export function useScrollAnimation() {
  return {
    fadeUp: {
      hidden:  { opacity: 0, y: 40 },
      visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
    },
    fadeIn: {
      hidden:  { opacity: 0 },
      visible: { opacity: 1, transition: { duration: 0.5 } },
    },
    fadeLeft: {
      hidden:  { opacity: 0, x: -40 },
      visible: { opacity: 1, x: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
    },
    fadeRight: {
      hidden:  { opacity: 0, x: 40 },
      visible: { opacity: 1, x: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
    },
    scaleIn: {
      hidden:  { opacity: 0, scale: 0.92 },
      visible: { opacity: 1, scale: 1, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
    },
    stagger: {
      hidden:  {},
      visible: { transition: { staggerChildren: 0.1 } },
    },
    staggerFast: {
      hidden:  {},
      visible: { transition: { staggerChildren: 0.06 } },
    },
  };
}

// ══════════════════════════════════════════════════════════
// useAnimatedCounter — spring-animated number
// ══════════════════════════════════════════════════════════
export function useAnimatedCounter(target: number, duration = 1500) {
  const [count, setCount] = useState(0);
  const [started, setStarted] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setStarted(true); },
      { threshold: 0.3 }
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!started) return;
    const startTime = performance.now();
    const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);

    const frame = (time: number) => {
      const elapsed  = time - startTime;
      const progress = Math.min(elapsed / duration, 1);
      setCount(Math.round(easeOut(progress) * target));
      if (progress < 1) requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  }, [started, target, duration]);

  return { count, ref };
}

// ══════════════════════════════════════════════════════════
// useOptimizer — encapsulates API call + min display time
// ══════════════════════════════════════════════════════════
export function useOptimizer() {
  const [result,    setResult]    = useState<OptimizeResult | null>(null);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string>('');

  const optimize = useCallback(async (payload: OptimizeRequest) => {
    setLoading(true);
    setError(null);
    setResult(null);
    const sid = generateId();
    setSessionId(sid);

    const start = Date.now();
    const MIN_MS = 4000; // minimum animation display time

    try {
      const res = await fetch('/api/optimize', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(payload),
      });

      const elapsed   = Date.now() - start;
      const remaining = Math.max(0, MIN_MS - elapsed);
      if (remaining > 0) await new Promise(r => setTimeout(r, remaining));

      const json = await res.json();

      if (!res.ok) {
        const msg = json.error || `Request failed (${res.status})`;
        if (res.status === 429) throw new Error('Rate limit reached. Please wait 1 minute and try again.');
        throw new Error(msg);
      }

      setResult({ ...json.data, sessionId: sid });
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setResult(null);
    setError(null);
    setLoading(false);
    setSessionId('');
  }, []);

  return { optimize, loading, error, result, reset, sessionId };
}
