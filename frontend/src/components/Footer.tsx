import { Github } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="border-t border-border py-8 px-6">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
        <span>© 2026 AXiOM</span>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <a href="/privacy-policy" className="hover:text-foreground hover:brightness-110 transition-colors">Privacy Policy</a>
          <span className="opacity-50">·</span>
          <a href="/terms" className="hover:text-foreground hover:brightness-110 transition-colors">Terms of Service</a>
          <span className="opacity-50">·</span>
          <a href="/documentation" className="hover:text-foreground hover:brightness-110 transition-colors">Documentation</a>
        </div>
        <div className="flex items-center justify-center gap-5">
          <a href="https://github.com/SkjOO5/Axiom" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">
            <Github size={16} />
          </a>
        </div>
        <span className="italic hidden lg:block">Built for a fairer future</span>
      </div>
    </footer>
  );
}
