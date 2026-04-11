import { motion } from 'framer-motion';
import ShaderBackground from './ShaderBackground';
import ScrollIndicator from './ScrollIndicator';
import { ArrowRight, Play } from 'lucide-react';
import { Link } from 'react-router-dom';

const words = ['AXiOM'];

export default function HeroSection() {
  return (
    <section id="about" className="relative min-h-screen flex items-center justify-center overflow-hidden">
      <ShaderBackground />

      <div className="relative z-10 text-center px-6 max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass-card text-xs uppercase tracking-[0.2em] text-muted-foreground mb-10"
          style={{ boxShadow: '0 0 20px hsl(217 91% 60% / 0.1), inset 0 0 20px hsl(217 91% 60% / 0.05)' }}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-glow-pulse" />
          AI Fairness Platform — AXiOM
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 60, filter: 'blur(8px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          transition={{ delay: 0.7, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="font-display font-bold leading-[0.95] mb-4 text-5xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-[7rem]"
        >
          AX<span style={{ fontFamily: "'Playfair Display', serif", fontStyle: 'italic', fontWeight: 400 }}>i</span>OM
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 30, filter: 'blur(6px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          transition={{ delay: 0.9, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="font-display text-xl md:text-2xl lg:text-3xl text-foreground/60 font-normal mb-6 italic"
        >
          Unbiased AI Decision
        </motion.p>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.3, duration: 0.7 }}
          className="text-muted-foreground text-base md:text-lg max-w-xl mx-auto mb-10 leading-relaxed text-balance"
        >
          Ensuring Fairness and Detecting Bias in Automated Decisions
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.5, duration: 0.7 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <Link to="/dashboard"
            className="group flex items-center gap-2 px-7 py-3 rounded-full text-sm font-medium text-primary-foreground transition-transform duration-200 active:scale-[0.97]"
            style={{ background: 'var(--gradient-primary)' }}
          >
            Explore Solution
            <ArrowRight size={16} className="transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
          <button className="flex items-center gap-2 px-7 py-3 rounded-full text-sm font-medium border border-border text-foreground hover:bg-foreground/5 transition-all duration-300 active:scale-[0.97]">
            <Play size={14} />
            Watch Demo
          </button>
        </motion.div>
      </div>

      <ScrollIndicator />
    </section>
  );
}
