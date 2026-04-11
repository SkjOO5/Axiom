import { Github, Twitter, Linkedin } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="border-t border-border py-8 px-6">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
        <span>© 2025 AXiOM</span>
        <div className="flex items-center gap-5">
          {[Github, Twitter, Linkedin].map((Icon, i) => (
            <a key={i} href="#" className="hover:text-foreground transition-colors">
              <Icon size={16} />
            </a>
          ))}
        </div>
        <span className="italic">Built for a fairer future</span>
      </div>
    </footer>
  );
}
