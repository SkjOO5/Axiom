import Navbar from '@/components/Navbar';
import { motion } from 'framer-motion';
import { Settings as SettingsIcon } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';

export default function Settings() {
  const { user } = useAuth();
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex flex-col">
      <Navbar />

      <div className="absolute top-1/4 -right-32 w-[600px] h-[600px] bg-primary/10 rounded-full mix-blend-screen filter blur-[128px] opacity-50 pointer-events-none" />
      
      <main className="flex-1 w-full max-w-4xl mx-auto px-6 py-32 z-10 flex flex-col items-center justify-center text-center">
        <motion.div
           initial={{ opacity: 0, scale: 0.9 }}
           animate={{ opacity: 1, scale: 1 }}
           transition={{ duration: 0.5 }}
           className="p-10 rounded-3xl glass-card bg-muted/10 border border-border shadow-2xl flex flex-col items-center"
        >
          <div className="w-20 h-20 rounded-2xl bg-primary/20 flex items-center justify-center mb-6 border border-primary/30">
            <SettingsIcon size={40} className="text-primary animate-spin-slow" style={{ animationDuration: '8s' }} />
          </div>
          <h1 className="text-4xl font-display font-medium text-foreground tracking-tight mb-4">
            Settings
          </h1>
          <p className="text-lg text-muted-foreground max-w-md">
            Global application settings and workspace configurations are coming soon.
          </p>
          <button 
            onClick={() => window.history.back()}
            className="mt-8 px-8 py-3 rounded-full border border-border hover:bg-muted/50 transition-colors text-foreground font-medium"
          >
            Go Back
          </button>
        </motion.div>
      </main>
    </div>
  );
}
