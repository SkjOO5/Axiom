import { motion, useInView } from 'framer-motion';
import { useRef, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

export default function CTASection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, amount: 0.3 });
  const navigate = useNavigate();
  const { user } = useAuth();
  const [email, setEmail] = useState('');

  return (
    <section id="contact" ref={ref} className="py-32 px-6">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="max-w-2xl mx-auto text-center"
      >
        <h2 className="font-display font-bold text-3xl md:text-5xl uppercase mb-4 text-balance">
          Ready to Build Fair AI?
        </h2>
        {user ? (
          <>
            <p className="text-muted-foreground mb-10">
              Welcome back! Start analyzing your data for bias and fairness.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto mb-8">
              <button
                onClick={() => navigate('/dashboard')}
                className="group flex items-center justify-center gap-2 px-6 py-3 rounded-full text-sm font-medium text-primary-foreground transition-transform duration-200 active:scale-[0.97] shrink-0"
                style={{ background: 'var(--gradient-primary)' }}
              >
                Go to Dashboard
                <ArrowRight size={14} className="transition-transform duration-300 group-hover:translate-x-1" />
              </button>
            </div>
          </>
        ) : (
          <>
            <p className="text-muted-foreground mb-10">
              Start detecting and eliminating bias in your systems today.
            </p>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                navigate('/signup', { state: { email: email.trim() } });
              }}
              className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto mb-8"
            >
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    navigate('/signup', { state: { email: email.trim() } });
                  }
                }}
                placeholder="Enter your email"
                className="flex-1 px-5 py-3 rounded-full glass-card text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-primary/50 transition-shadow"
              />
              <button
                type="submit"
                className="group flex items-center justify-center gap-2 px-6 py-3 rounded-full text-sm font-medium text-primary-foreground transition-transform duration-200 active:scale-[0.97] shrink-0"
                style={{ background: 'var(--gradient-primary)' }}
              >
                Get Started
                <ArrowRight size={14} className="transition-transform duration-300 group-hover:translate-x-1" />
              </button>
            </form>
          </>
        )}


      </motion.div>
    </section>
  );
}
