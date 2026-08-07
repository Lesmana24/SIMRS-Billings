import React from 'react';
import { motion } from 'framer-motion';

export const AmbientBackground = () => {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 select-none">
      {/* 1. Ambient Breathing Mesh Gradient Orb - Top Right */}
      <motion.div
        animate={{
          scale: [1, 1.15, 1],
          opacity: [0.4, 0.65, 0.4],
          x: [0, 25, 0],
          y: [0, -20, 0],
        }}
        transition={{
          duration: 14,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="absolute -top-36 -right-36 w-[600px] h-[600px] rounded-full bg-emerald-500/25 blur-[100px] dark:bg-emerald-500/20"
      />

      {/* 2. Ambient Breathing Mesh Gradient Orb - Bottom Left */}
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.35, 0.6, 0.35],
          x: [0, -20, 0],
          y: [0, 25, 0],
        }}
        transition={{
          duration: 18,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 2,
        }}
        className="absolute -bottom-44 -left-44 w-[650px] h-[650px] rounded-full bg-cyan-500/20 blur-[110px] dark:bg-teal-500/15"
      />

      {/* 3. Architectural Ledger Micro-Dot Pattern */}
      <div 
        className="absolute inset-0 opacity-15 dark:opacity-20 text-[var(--text-heading)] pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)`,
          backgroundSize: '32px 32px',
        }}
      />

      {/* 4. Minimalist EKG Heartbeat Line (Visible Medical Accent at Bottom) */}
      <div className="absolute inset-x-0 bottom-0 opacity-30 dark:opacity-40 overflow-hidden pointer-events-none">
        <svg
          className="w-full h-28 text-emerald-400 dark:text-emerald-500"
          viewBox="0 0 1200 120"
          preserveAspectRatio="none"
          fill="none"
        >
          <path
            d="M0 60 H300 L310 40 L320 80 L335 10 L350 110 L365 50 L375 70 L385 60 H600 L610 30 L620 90 L635 0 L650 120 L665 45 L675 75 L685 60 H900 L910 40 L920 80 L935 15 L950 105 L965 50 L975 70 L985 60 H1200"
            stroke="currentColor"
            strokeWidth="2"
            strokeDasharray="600"
            className="animate-dash"
          />
        </svg>
      </div>
    </div>
  );
};
