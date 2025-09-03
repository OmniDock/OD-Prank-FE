import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="relative w-full bg-transparent dark:bg-black/50 backdrop-blur-md">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col items-center gap-6">
          {/* Legal Links */}
          <div className="flex flex-wrap justify-center gap-6">
            <Link to="/privacy" className="text-sm text-neutral-600 dark:text-neutral-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors">
              Privacy Policy
            </Link>
            <Link to="/terms" className="text-sm text-neutral-600 dark:text-neutral-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors">
              Terms of Service / AGB
            </Link>
            <Link to="/imprint" className="text-sm text-neutral-600 dark:text-neutral-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors">
              Impressum
            </Link>
            <Link to="/blacklist" className="text-sm text-gradient hover:text-purple-600 dark:hover:text-purple-400 transition-colors">
              Blacklist
            </Link>
          </div>

          
          {/* Copyright */}
          <p className="text-sm text-neutral-600 dark:text-neutral-400 text-center">
            © {new Date().getFullYear()} Callit.ai. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
