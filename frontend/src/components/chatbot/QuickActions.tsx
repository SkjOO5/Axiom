import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

type QuickActionsProps = {
  actions: string[];
  onAction: (value: string) => void;
};

export default function QuickActions({ actions, onAction }: QuickActionsProps) {
  const [dismissed, setDismissed] = useState(false);

  const handleClick = (action: string) => {
    setDismissed(true);
    onAction(action);
  };

  return (
    <AnimatePresence>
      {!dismissed && (
        <motion.div
          className="pt-2"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, y: 4, transition: { duration: 0.2 } }}
        >
          <p className="mb-2 text-[10px] font-medium uppercase tracking-wider text-white/30">
            Suggested
          </p>
          <div className="flex flex-wrap gap-2">
            {actions.map((action, i) => (
              <motion.button
                key={action}
                type="button"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07 }}
                whileHover={{ y: -1 }}
                onClick={() => handleClick(action)}
                className="inline-flex items-center rounded-full px-3.5 py-1.5 text-xs font-medium transition-all duration-200"
                style={{
                  background: "rgba(139, 92, 246, 0.08)",
                  border: "1px solid rgba(139, 92, 246, 0.2)",
                  color: "rgba(167, 139, 250, 0.9)",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background = "rgba(139,92,246,0.2)";
                  (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(139,92,246,0.45)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background = "rgba(139,92,246,0.08)";
                  (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(139,92,246,0.2)";
                }}
              >
                {action}
              </motion.button>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
