import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, EyeOff, ArrowRight } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; general?: string }>({});
  const [isLoading, setIsLoading] = useState(false);

  const validate = () => {
    const newErrors: typeof errors = {};
    if (!email.trim()) {
      newErrors.email = 'Email is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Please enter a valid email address.';
    }
    if (!password) {
      newErrors.password = 'Password is required.';
    }
    return newErrors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    setErrors({});
    setIsLoading(true);

    const error = await login(email, password);
    setIsLoading(false);
    if (error) {
      setErrors({ general: error });
    } else {
      navigate('/dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 relative overflow-hidden">
      {/* Subtle background glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 80% 60% at 50% 0%, hsl(217 91% 60% / 0.08), transparent 70%)',
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <Link
          to="/"
          className="flex items-center gap-2 font-sans font-medium text-base tracking-wide mb-10 justify-center"
        >
          <span className="w-2 h-2 rounded-full bg-primary animate-glow-pulse" />
          AX<span style={{ fontFamily: "'Playfair Display', serif", fontStyle: 'italic', fontWeight: 400 }}>i</span>OM
        </Link>

        <div className="glass-card rounded-2xl p-8 border border-border">
          <h1 className="font-display font-bold text-2xl mb-1">Welcome back</h1>
          <p className="text-muted-foreground text-sm mb-8">
            Log in to your AXiOM account.
          </p>

          <form onSubmit={handleSubmit} noValidate className="space-y-5">
            {/* Email */}
            <div>
              <label htmlFor="login-email" className="block text-sm font-medium mb-1.5 text-foreground/80">
                Email
              </label>
              <input
                id="login-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setErrors((p) => ({ ...p, email: undefined })); }}
                placeholder="you@example.com"
                className={`w-full px-4 py-3 rounded-xl bg-muted/40 border text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 transition-shadow ${
                  errors.email ? 'border-destructive focus:ring-destructive/40' : 'border-border focus:ring-primary/40'
                }`}
              />
              {errors.email && <p className="text-destructive text-xs mt-1.5">{errors.email}</p>}
            </div>

            {/* Password */}
            <div>
              <label htmlFor="login-password" className="block text-sm font-medium mb-1.5 text-foreground/80">
                Password
              </label>
              <div className="relative">
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setErrors((p) => ({ ...p, password: undefined })); }}
                  placeholder="••••••••"
                  className={`w-full px-4 py-3 pr-11 rounded-xl bg-muted/40 border text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 transition-shadow ${
                    errors.password ? 'border-destructive focus:ring-destructive/40' : 'border-border focus:ring-primary/40'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && <p className="text-destructive text-xs mt-1.5">{errors.password}</p>}
            </div>

            {errors.general && (
              <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-lg text-xs text-destructive">
                {errors.general}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="group w-full flex items-center justify-center gap-2 px-6 py-3 rounded-full text-sm font-medium text-primary-foreground transition-all duration-200 active:scale-[0.97] disabled:opacity-60 disabled:cursor-not-allowed mt-2"
              style={{ background: 'var(--gradient-primary)' }}
            >
              {isLoading ? 'Logging in…' : 'Log In'}
              {!isLoading && <ArrowRight size={14} className="transition-transform duration-300 group-hover:translate-x-1" />}
            </button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-6">
            Don&apos;t have an account?{' '}
            <Link to="/signup" className="text-primary hover:underline font-medium">
              Sign up
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
