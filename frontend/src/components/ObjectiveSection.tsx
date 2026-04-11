import { motion, useInView, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';

export default function ObjectiveSection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, amount: 0.3 });
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const y = useTransform(scrollYProgress, [0, 1], [80, -80]);

  return (
    <section ref={ref} className="min-h-screen flex flex-col items-center justify-center py-32 px-6 overflow-hidden relative">
      <motion.div style={{ y }} className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
        <h2 className="font-display font-bold uppercase text-[3rem] sm:text-[5rem] md:text-[7rem] lg:text-[9rem] leading-[0.9] text-center text-foreground/[0.03] max-w-[90vw]">
          Inspect Data For Hidden Unfairness
        </h2>
      </motion.div>

      <div className="relative z-10 max-w-3xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="section-label justify-center mb-8">Our Mission</div>
          <div className="h-px w-48 mx-auto mb-10" style={{ background: 'var(--gradient-primary)' }} />

          <h3 className="font-display font-bold text-2xl md:text-3xl lg:text-4xl leading-tight mb-6 text-balance">
            Build a clear, accessible solution to inspect data sets and software models for hidden unfairness
          </h3>

          <p className="text-muted-foreground text-lg leading-relaxed max-w-xl mx-auto">
            Provide organizations with an easy way to measure, flag, and fix harmful bias before their systems impact real people.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
