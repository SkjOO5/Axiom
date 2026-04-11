import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import { Search, BarChart3, Shield } from 'lucide-react';

const steps = [
  {
    num: '01',
    icon: Search,
    title: 'INSPECT',
    desc: 'Upload your dataset or connect your model. Our system scans for hidden patterns of discrimination across all protected categories.',
  },
  {
    num: '02',
    icon: BarChart3,
    title: 'MEASURE',
    desc: 'Get detailed bias metrics and fairness scores. Visual dashboards show exactly where and how bias manifests.',
  },
  {
    num: '03',
    icon: Shield,
    title: 'FIX',
    desc: 'Receive actionable recommendations and automated debiasing tools. Monitor ongoing fairness in production.',
  },
];

export default function SolutionSection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, amount: 0.2 });

  return (
    <section id="solution" ref={ref} className="min-h-screen py-32 px-6">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="section-label mb-4"
        >
          How It Works
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="font-display font-bold text-3xl md:text-4xl mb-16"
        >
          Three Steps to Fairness
        </motion.h2>

        <div className="grid md:grid-cols-3 gap-6">
          {steps.map((s, i) => (
            <motion.div
              key={s.num}
              initial={{ opacity: 0, y: 30, filter: 'blur(4px)' }}
              animate={inView ? { opacity: 1, y: 0, filter: 'blur(0px)' } : {}}
              transition={{ duration: 0.7, delay: 0.2 + i * 0.1, ease: [0.16, 1, 0.3, 1] }}
              className="glass-card gradient-border rounded-2xl p-8 group hover:-translate-y-1 transition-transform duration-300"
            >
              <span className="font-display text-5xl font-bold text-foreground/10 block mb-4">
                {s.num}
              </span>
              <s.icon size={28} className="text-primary mb-4" />
              <h3 className="font-display font-bold text-lg tracking-wider mb-3">{s.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
