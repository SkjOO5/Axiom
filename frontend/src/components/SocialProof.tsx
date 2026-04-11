import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';

const logos = ['TechCorp', 'FairBank', 'HealthFirst AI', 'GovTech', 'EqualHire', 'DataEthics Co', 'OpenFair', 'NeutralNet'];

export default function SocialProof() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, amount: 0.3 });

  return (
    <section ref={ref} className="py-32 px-6 overflow-hidden">
      <div className="max-w-7xl mx-auto">
        {/* Marquee */}
        <div className="relative mb-20">
          <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-background to-transparent z-10" />
          <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-background to-transparent z-10" />
          <div className="flex animate-marquee whitespace-nowrap">
            {[...logos, ...logos].map((l, i) => (
              <span key={i} className="mx-10 text-xl font-display font-bold text-foreground/10 uppercase tracking-wider">
                {l}
              </span>
            ))}
          </div>
        </div>

        {/* Testimonial */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-2xl mx-auto text-center"
        >
          <blockquote className="text-xl md:text-2xl font-light italic leading-relaxed text-foreground/80 mb-6">
            "This platform transformed how we approach fairness in our lending models. We caught bias patterns we never knew existed."
          </blockquote>
          <div className="text-sm text-muted-foreground">
            <span className="text-foreground font-medium">Sarah Chen</span> — VP of AI Ethics, FairBank
          </div>
        </motion.div>
      </div>
    </section>
  );
}
