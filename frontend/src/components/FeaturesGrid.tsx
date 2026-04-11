import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import { Activity, Radar, ScanEye, FileText, Brain, MonitorCheck } from 'lucide-react';

const features = [
  { icon: Activity, title: 'Real-Time Bias Detection', desc: 'Continuously monitor your models for emerging bias patterns with live dashboards and instant alerts.', large: true },
  { icon: Radar, title: 'Multi-Dimensional Analysis', desc: 'Evaluate fairness across gender, race, age, and other protected categories simultaneously.', large: true },
  { icon: ScanEye, title: 'Protected Category Scanning', desc: 'Automatic detection of sensitive attributes.' },
  { icon: FileText, title: 'Compliance Reports', desc: 'Generate audit-ready fairness documentation.' },
  { icon: Brain, title: 'Model Explainability', desc: 'Understand why your model makes each decision.' },
  { icon: MonitorCheck, title: 'Continuous Monitoring', desc: 'Track fairness metrics over time in production.' },
];

export default function FeaturesGrid() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, amount: 0.2 });

  return (
    <section id="features" ref={ref} className="min-h-screen py-32 px-6">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="section-label mb-4"
        >
          Capabilities
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="font-display font-bold text-3xl md:text-4xl mb-16"
        >
          Built for Fairness
        </motion.h2>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 auto-rows-[200px]">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 24, filter: 'blur(4px)' }}
              animate={inView ? { opacity: 1, y: 0, filter: 'blur(0px)' } : {}}
              transition={{ duration: 0.7, delay: 0.15 + i * 0.08, ease: [0.16, 1, 0.3, 1] }}
              className={`glass-card gradient-border rounded-2xl p-6 flex flex-col justify-end hover:-translate-y-1 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 ${
                f.large ? 'md:col-span-2 md:row-span-2' : ''
              }`}
            >
              <f.icon size={f.large ? 32 : 24} className="text-primary mb-3" />
              <h3 className={`font-display font-bold mb-1.5 ${f.large ? 'text-xl' : 'text-sm'}`}>{f.title}</h3>
              <p className={`text-muted-foreground leading-relaxed ${f.large ? 'text-sm max-w-sm' : 'text-xs'}`}>{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
