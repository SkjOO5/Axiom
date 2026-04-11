export default function ScrollIndicator() {
  return (
    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3 z-10">
      <span className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground writing-mode-vertical"
        style={{ writingMode: 'vertical-rl' }}
      >
        Scroll
      </span>
      <div className="w-px h-12 bg-border relative overflow-hidden">
        <div className="w-full h-3 bg-primary rounded-full animate-scroll-dot absolute top-0" />
      </div>
    </div>
  );
}
