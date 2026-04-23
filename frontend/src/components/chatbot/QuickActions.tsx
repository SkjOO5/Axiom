type QuickActionsProps = {
  actions: string[];
  onAction: (value: string) => void;
};

export default function QuickActions({ actions, onAction }: QuickActionsProps) {
  return (
    <div className="pt-1">
      <div className="flex flex-wrap gap-2">
        {actions.map((action) => (
          <button
            key={action}
            type="button"
            onClick={() => onAction(action)}
            className="rounded-full border border-border bg-muted px-3 py-1.5 text-xs text-foreground transition-all hover:border-primary/70 hover:text-primary"
          >
            {action}
          </button>
        ))}
      </div>
    </div>
  );
}
