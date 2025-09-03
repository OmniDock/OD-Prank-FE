import { Link } from "react-router-dom";
import { PhoneIcon } from "@heroicons/react/24/outline";

export default function Footer() {
  return (
    <footer className="relative w-full bg-transparent dark:bg-black/50 backdrop-blur-md">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-4">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <PhoneIcon className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              <span className="text-lg font-bold bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-400 dark:to-pink-400 bg-clip-text text-transparent">
                Callit.ai
              </span>
            </div>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 max-w-md">
              Create hilarious AI-powered prank calls with realistic voices. 
              Choose from our templates or craft your own custom scenarios.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold mb-2 text-neutral-800 dark:text-neutral-200">Quick Links</h3>
            <ul className="space-y-1">
              <li>
                <Link to="/dashboard" className="text-sm text-neutral-600 dark:text-neutral-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors">
                  Dashboard
                </Link>
              </li>
              <li>
                <Link to="/scenarios" className="text-sm text-neutral-600 dark:text-neutral-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors">
                  Templates
                </Link>
              </li>
              <li>
                <Link to="/pricing" className="text-sm text-neutral-600 dark:text-neutral-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors">
                  Pricing
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="font-semibold mb-2 text-neutral-800 dark:text-neutral-200">Legal</h3>
            <ul className="space-y-1">
              <li>
                <Link to="/privacy" className="text-sm text-neutral-600 dark:text-neutral-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/terms" className="text-sm text-neutral-600 dark:text-neutral-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link to="/disclaimer" className="text-sm text-neutral-600 dark:text-neutral-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors">
                  Disclaimer
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-4 border-t border-black/10 dark:border-white/10">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              © {new Date().getFullYear()} PrankCall.ai. All rights reserved.
            </p>
            <p className="text-xs text-neutral-500 dark:text-neutral-500">
              For entertainment purposes only. Always get consent before recording calls.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
