import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, LogOut, User, ChevronDown, Settings } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

const links = ['Home', 'About', 'Problem', 'Solution', 'Features', 'Contact'];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const isLandingPage = location.pathname === '/';
  const visibleLinks = isLandingPage ? links : ['Home'];

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scrollTo = (id: string) => {
    setOpen(false);
    if (id === 'Home') {
      navigate('/');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    document.getElementById(id.toLowerCase())?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <>
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          scrolled ? 'bg-background/70 backdrop-blur-xl border-b border-border/50' : ''
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" onClick={() => setOpen(false)} className="flex items-center gap-2 font-sans font-medium text-base tracking-wide">
            <span className="w-2 h-2 rounded-full bg-primary animate-glow-pulse" />
            AX<span style={{ fontFamily: "'Playfair Display', serif", fontStyle: 'italic', fontWeight: 400 }}>i</span>OM
          </Link>

          <div className="hidden md:flex items-center gap-8">
            {visibleLinks.map((l) => (
              <button key={l} onClick={() => scrollTo(l)} className="nav-link">
                {l}
              </button>
            ))}
          </div>

          {/* Auth buttons – desktop */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setProfileOpen(!profileOpen)}
                  className="flex items-center gap-2 px-2 py-1.5 rounded-full border border-border bg-muted/20 hover:bg-muted/40 transition-colors"
                >
                  <div 
                    className="w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs uppercase overflow-hidden"
                    style={{ background: user.user_metadata?.avatar_url ? 'none' : 'var(--gradient-primary)' }}
                  >
                    {user.user_metadata?.avatar_url ? (
                      <img src={user.user_metadata.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-primary-foreground">{user.email.substring(0, 2)}</span>
                    )}
                  </div>
                  <ChevronDown size={14} className="text-muted-foreground" />
                </button>

                <AnimatePresence>
                  {profileOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      className="absolute right-0 mt-2 w-56 rounded-xl border border-border bg-background shadow-xl overflow-hidden glass-card"
                    >
                      <div className="p-4 border-b border-border/50">
                        <p className="text-sm font-medium truncate text-foreground">{user.email}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">Free Member</p>
                      </div>
                      <div className="p-2">
                        <button 
                          onClick={() => { setProfileOpen(false); navigate('/profile'); }}
                          className="w-full flex items-center gap-3 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/30 rounded-lg transition-colors"
                        >
                          <User size={16} />
                          My Profile
                        </button>
                        <button 
                          onClick={() => { setProfileOpen(false); navigate('/dashboard'); }}
                          className="w-full flex items-center gap-3 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/30 rounded-lg transition-colors"
                        >
                          <Menu size={16} className="rotate-90" />
                          Dashboard
                        </button>
                        <button 
                          onClick={() => { setProfileOpen(false); navigate('/settings'); }}
                          className="w-full flex items-center gap-3 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/30 rounded-lg transition-colors"
                        >
                          <Settings size={16} />
                          Settings
                        </button>
                        <div className="h-px bg-border/50 my-1 mx-2" />
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-500 hover:bg-red-500/10 rounded-lg transition-colors mt-1"
                        >
                          <LogOut size={16} />
                          Log Out
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-xs uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground transition-colors duration-300"
                >
                  Log In
                </Link>
                <Link
                  to="/signup"
                  className="px-4 py-1.5 rounded-full text-xs font-semibold text-primary-foreground transition-transform duration-200 active:scale-[0.97]"
                  style={{ background: 'var(--gradient-primary)' }}
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>

          <button
            onClick={() => setOpen(!open)}
            className="md:hidden text-foreground"
            aria-label="Toggle menu"
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </motion.nav>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-40 bg-background/95 backdrop-blur-2xl flex flex-col items-center justify-center gap-8"
          >
            {visibleLinks.map((l, i) => (
              <motion.button
                key={l}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08, duration: 0.4 }}
                onClick={() => scrollTo(l)}
                className="text-3xl font-display font-bold uppercase tracking-wider text-foreground"
              >
                {l}
              </motion.button>
            ))}
            {/* Auth links – mobile menu */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: visibleLinks.length * 0.08 + 0.1, duration: 0.4 }}
              className="flex flex-col items-center gap-3 mt-4"
            >
              {user ? (
                <div className="flex flex-col items-center w-full px-6 mt-6">
                  <div className="flex flex-col items-center gap-3 mb-6">
                    <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-2xl uppercase border border-primary/30">
                      {user.email.substring(0, 2)}
                    </div>
                    <span className="text-lg font-medium text-foreground">{user.email}</span>
                  </div>
                  
                  <div className="w-full h-px bg-border/50 my-2" />
                  
                  <button 
                    onClick={() => { setOpen(false); navigate('/profile'); }}
                    className="w-full flex flex-col items-center justify-center py-4 text-base text-muted-foreground hover:text-foreground hover:bg-muted/20 rounded-xl transition-colors"
                  >
                    <span className="flex items-center gap-2"><User size={18} /> My Profile</span>
                  </button>
                  <button 
                    onClick={() => { setOpen(false); navigate('/dashboard'); }}
                    className="w-full flex flex-col items-center justify-center py-4 text-base text-muted-foreground hover:text-foreground hover:bg-muted/20 rounded-xl transition-colors"
                  >
                    <span className="flex items-center gap-2"><Menu size={18} /> Dashboard</span>
                  </button>
                  <button 
                    onClick={() => { setOpen(false); navigate('/settings'); }}
                    className="w-full flex flex-col items-center justify-center py-4 text-base text-muted-foreground hover:text-foreground hover:bg-muted/20 rounded-xl transition-colors"
                  >
                    <span className="flex items-center gap-2"><Settings size={18} /> Settings</span>
                  </button>
                  
                  <div className="w-full h-px bg-border/50 my-2" />
                  
                  <button
                    onClick={() => { setOpen(false); handleLogout(); }}
                    className="w-full flex flex-col items-center justify-center py-4 text-base text-red-500 hover:bg-red-500/10 rounded-xl transition-colors"
                  >
                    <span className="flex items-center gap-2"><LogOut size={18} /> Log Out</span>
                  </button>
                </div>
              ) : (
                <>
                  <Link
                    to="/login"
                    onClick={() => setOpen(false)}
                    className="text-sm uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Log In
                  </Link>
                  <Link
                    to="/signup"
                    onClick={() => setOpen(false)}
                    className="px-6 py-2 rounded-full text-sm font-semibold text-primary-foreground"
                    style={{ background: 'var(--gradient-primary)' }}
                  >
                    Sign Up
                  </Link>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
