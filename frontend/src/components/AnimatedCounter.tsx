import { useEffect, useRef, useState } from 'react';
import { motion, useInView } from 'framer-motion';

interface Props {
  value: string;
  label: string;
  suffix?: string;
}

export default function AnimatedCounter({ value, label, suffix = '' }: Props) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.5 });
  const [count, setCount] = useState(0);
  const numericValue = parseFloat(value);

  useEffect(() => {
    if (!isInView) return;
    let start = 0;
    const duration = 1800;
    const startTime = performance.now();

    const tick = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      start = eased * numericValue;
      setCount(start);
      if (progress < 1) requestAnimationFrame(tick);
    };

    requestAnimationFrame(tick);
  }, [isInView, numericValue]);

  const display = Number.isInteger(numericValue)
    ? Math.round(count).toString()
    : count.toFixed(1);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="text-center"
    >
      <div className="text-4xl md:text-5xl font-display font-bold gradient-text">
        {display}{suffix}
      </div>
      <div className="text-sm text-muted-foreground mt-2 max-w-[160px] mx-auto leading-relaxed">
        {label}
      </div>
    </motion.div>
  );
}
