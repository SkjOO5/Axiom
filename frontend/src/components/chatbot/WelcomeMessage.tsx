import { Sparkles, BarChart3, Shield, FileSearch, Lightbulb } from "lucide-react";
import { motion } from "framer-motion";

interface WelcomeCardProps {
  icon: React.ElementType;
  title: string;
  onClick: (title: string) => void;
}

function WelcomeCard({ icon: Icon, title, onClick }: WelcomeCardProps) {
  return (
    <motion.button
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.97 }}
      onClick={() => onClick(title)}
      type="button"
      className="flex flex-col items-center justify-center gap-2 w-full rounded-xl p-2.5 transition-colors duration-200"
      style={{
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.06)",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLButtonElement).style.background = "rgba(139,92,246,0.1)";
        (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(139,92,246,0.3)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.03)";
        (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.06)";
      }}
    >
      <Icon className="w-4 h-4 text-purple-400" />
      <span className="text-[12px] font-medium text-center" style={{ color: "rgba(255,255,255,0.5)" }}>
        {title}
      </span>
    </motion.button>
  );
}

interface WelcomeMessageProps {
  onAction: (text: string) => void;
}

export default function WelcomeMessage({ onAction }: WelcomeMessageProps) {
  return (
    <div className="flex flex-col items-center w-full py-4">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4"
        style={{
          background: "linear-gradient(135deg, #8B5CF6, #3B82F6)",
          boxShadow: "0 0 20px rgba(139,92,246,0.3)",
        }}
      >
        <Sparkles className="w-6 h-6 text-white" />
      </motion.div>

      <motion.h3
        initial={{ y: 8, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="text-center font-semibold text-lg mb-1 text-white"
      >
        Welcome to AXiOM AI
      </motion.h3>

      <motion.p
        initial={{ y: 8, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.15 }}
        className="text-center text-sm mb-5"
        style={{ color: "rgba(255,255,255,0.4)" }}
      >
        Your AI Fairness Expert Assistant
      </motion.p>

      <motion.div
        initial={{ y: 8, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-2 gap-2 w-full mb-2"
      >
        <WelcomeCard icon={BarChart3} title="Explain Metrics" onClick={onAction} />
        <WelcomeCard icon={Shield} title="Compliance" onClick={onAction} />
        <WelcomeCard icon={FileSearch} title="Analyze Results" onClick={onAction} />
        <WelcomeCard icon={Lightbulb} title="Fix Bias" onClick={onAction} />
      </motion.div>
    </div>
  );
}
