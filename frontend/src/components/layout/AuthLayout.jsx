import React from 'react';
import { Hospital, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';

export const AuthLayout = ({ children, title, subtitle }) => {
  return (
    <div className="min-h-screen relative w-full flex items-center justify-center p-4 md:p-8 bg-[#070b12] overflow-hidden select-none">
      {/* 1. Framer-Motion Ambient Particle Orbs */}
      <motion.div
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.15, 0.25, 0.15],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="absolute top-[-15%] left-[20%] w-[600px] h-[600px] bg-emerald-600/15 rounded-full blur-[150px] pointer-events-none"
      />

      <motion.div
        animate={{
          scale: [1, 1.15, 1],
          opacity: [0.1, 0.2, 0.1],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 2
        }}
        className="absolute bottom-[-15%] right-[20%] w-[600px] h-[600px] bg-teal-500/15 rounded-full blur-[160px] pointer-events-none"
      />

      {/* 2. Medical Tech Grid Pattern Background */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-[0.025]"
        style={{
          backgroundImage: `
            radial-gradient(circle at 1px 1px, #10b981 1px, transparent 0),
            linear-gradient(to right, #10b981 1px, transparent 1px),
            linear-gradient(to bottom, #10b981 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px, 80px 80px, 80px 80px',
        }}
      />

      {/* 3. Smooth Medical EKG Pulse Line SVG Wave Background */}
      <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 opacity-15 pointer-events-none overflow-hidden">
        <svg
          className="w-full h-56 text-emerald-500/50"
          viewBox="0 0 1200 120"
          preserveAspectRatio="none"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M0 60 H300 L310 40 L320 80 L335 10 L350 110 L365 50 L375 70 L385 60 H600 L610 30 L620 90 L635 0 L650 120 L665 45 L675 75 L685 60 H900 L910 40 L920 80 L935 15 L950 105 L965 50 L975 70 L985 60 H1200"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeDasharray="1200"
            className="animate-[dash_18s_linear_infinite]"
          />
        </svg>
      </div>

      {/* 4. Main Auth Card Container with Framer-Motion Spring Entrance */}
      <motion.div 
        initial={{ opacity: 0, y: 24, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: "spring", stiffness: 220, damping: 22 }}
        className="relative z-10 w-full max-w-md space-y-6 my-auto"
      >
        {/* Header Branding */}
        <div className="text-center space-y-3">
          <motion.div 
            whileHover={{ scale: 1.08, rotate: 3 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
            className="relative inline-flex items-center justify-center p-3.5 bg-gradient-to-b from-emerald-950/90 to-slate-950 text-emerald-400 rounded-2xl border border-emerald-500/30 shadow-xl shadow-emerald-950/80 group cursor-pointer"
          >
            <div className="absolute inset-0 bg-emerald-500/20 rounded-2xl blur-md group-hover:blur-xl transition-all duration-300" />
            <Hospital size={36} className="relative z-10 text-emerald-400" />
          </motion.div>

          <div>
            <motion.div 
              whileHover={{ scale: 1.03 }}
              className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-950/50 border border-emerald-500/20 text-[11px] text-emerald-400 font-medium mb-2.5 shadow-sm hover:border-emerald-500/40 transition-colors duration-200"
            >
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
              </span>
              <span>SIMRS Billing System</span>
            </motion.div>

            <h1 className="text-2xl font-black text-white tracking-tight bg-gradient-to-r from-white via-slate-100 to-emerald-200 bg-clip-text text-transparent">
              {title || 'SIMRS Billing Engine'}
            </h1>
            <p className="text-xs md:text-sm text-slate-400 mt-1">
              {subtitle || 'Sistem Informasi Management Billing & Pembayaran Rumah Sakit'}
            </p>
          </div>
        </div>

        {/* Card Body */}
        <motion.div 
          whileHover={{ borderColor: 'rgba(16, 185, 129, 0.35)' }}
          transition={{ duration: 0.2 }}
          className="glass-panel p-6 sm:p-8 space-y-6 shadow-2xl shadow-emerald-950/60 border-emerald-500/20 backdrop-blur-2xl relative overflow-hidden"
        >
          {/* Top Animated Shimmer Accent Line inside Card */}
          <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-emerald-400 to-transparent opacity-80" />
          
          {children}
        </motion.div>

        {/* Footer info */}
        <div className="text-center text-[11px] text-slate-500 flex items-center justify-center gap-2">
          <ShieldCheck size={13} className="text-emerald-500/70" />
          <span>Keamanan Terenkripsi RS &copy; {new Date().getFullYear()}</span>
        </div>
      </motion.div>
    </div>
  );
};
