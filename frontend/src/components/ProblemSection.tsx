import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import AnimatedCounter from './AnimatedCounter';

function BiasRings() {
  return (
    <div className="relative w-full aspect-square max-w-[400px] mx-auto">
      {[1, 2, 3, 4].map((i) => (
        <motion.div
          key={i}
          className="absolute inset-0 m-auto rounded-full border"
          style={{
            width: `${100 - i * 18}%`,
            height: `${100 - i * 18}%`,
            borderColor: i % 2 === 0 ? 'hsl(217 91% 60% / 0.3)' : 'hsl(0 70% 50% / 0.2)',
          }}
          animate={{ rotate: i % 2 === 0 ? 360 : -360 }}
          transition={{ duration: 20 + i * 8, repeat: Infinity, ease: 'linear' }}
        >
          {[0, 90, 180, 270].map((deg) => (
            <div
              key={deg}
              className="absolute w-2 h-2 rounded-full"
              style={{
                top: '50%',
                left: '50%',
                transform: `rotate(${deg}deg) translateY(-50%) translateX(-50%)`,
                transformOrigin: `0 ${(100 - i * 18) / 2}%`,
                background: i % 2 === 0 ? 'hsl(217 91% 60% / 0.5)' : 'hsl(0 70% 50% / 0.4)',
              }}
            />
          ))}
        </motion.div>
      ))}
      <div className="absolute inset-0 m-auto w-4 h-4 rounded-full bg-primary/60 blur-sm" />
    </div>
  );
}

const fadeUp = {
  hidden: { opacity: 0, y: 24, filter: 'blur(4px)' },
  visible: { opacity: 1, y: 0, filter: 'blur(0px)' },
};

export default function ProblemSection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, amount: 0.2 });

  return (
    <section id="problem" ref={ref} className="min-h-screen py-32 px-6">
      <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
        <motion.div
          initial="hidden"
          animate={inView ? 'visible' : 'hidden'}
          variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
        >
          <motion.div variants={fadeUp} transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }} className="section-label mb-6">
            The Problem
          </motion.div>

          <motion.h2
            variants={fadeUp}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="font-display font-bold text-3xl md:text-4xl lg:text-5xl leading-tight mb-6 text-balance"
          >
            Algorithms Are Making Life-Changing Decisions
          </motion.h2>

          <motion.p
            variants={fadeUp}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="text-muted-foreground leading-relaxed mb-12 max-w-lg"
          >
            Computer programs now decide who gets a job, a bank loan, or even medical care. When these programs learn from flawed or biased historical data, they repeat and amplify discriminatory patterns — affecting millions of real lives.
          </motion.p>

          <motion.div
            variants={fadeUp}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="grid grid-cols-3 gap-6"
          >
            <AnimatedCounter value="78" suffix="%" label="of hiring algorithms show gender bias" />
            <AnimatedCounter value="2.5" suffix="x" label="higher loan denial for minorities" />
            <AnimatedCounter value="45" suffix="%" label="of healthcare AI has racial bias" />
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={inView ? { opacity: 1, scale: 1 } : {}}
          transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
        >
          <BiasRings />
        </motion.div>
      </div>
    </section>
  );
}
