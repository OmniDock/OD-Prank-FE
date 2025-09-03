import { useEffect } from "react";
import { useLocation } from "react-router-dom";

export default function ScrollToHash() {
  const location = useLocation();

  useEffect(() => {
    if (location.hash) {
      const id = location.hash.replace('#', '');
      const element = document.getElementById(id);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else {
        // Retry shortly after mount if the section hasn't been rendered yet
        const timeout = setTimeout(() => {
          const retry = document.getElementById(id);
          if (retry) {
            retry.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }, 50);
        return () => clearTimeout(timeout);
      }
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [location.pathname, location.hash]);

  return null;
}


