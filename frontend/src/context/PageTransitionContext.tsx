import React, { createContext, useContext, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";

interface TransitionContextValue {
  triggerTransition: (targetPath: string, originElement?: HTMLElement) => void;
  isTransitioning: boolean;
}

const TransitionContext = createContext<TransitionContextValue | undefined>(undefined);

export function PageTransitionProvider({ children }: { children: React.ReactNode }) {
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [transitionData, setTransitionData] = useState<{
    targetPath: string;
    originRect?: DOMRect;
  } | null>(null);
  const navigate = useNavigate();

  const triggerTransition = useCallback((targetPath: string, originElement?: HTMLElement) => {
    if (isTransitioning) return;

    const rect = originElement?.getBoundingClientRect();
    setTransitionData({ targetPath, originRect: rect });
    setIsTransitioning(true);

    // Start the transition animation
    setTimeout(() => {
      navigate(targetPath);
      // Reset after navigation
      setTimeout(() => {
        setIsTransitioning(false);
        setTransitionData(null);
      }, 1000); // Match with CSS transition duration
    }, 1500); // Delay navigation until expansion animation is midway
  }, [isTransitioning, navigate]);

  return (
    <TransitionContext.Provider value={{ triggerTransition, isTransitioning }}>
      {children}
      {/* Transition overlay */}
      {isTransitioning && transitionData && (
        <div className="fixed inset-0 z-[9999] pointer-events-none">
          {/* Portal effect overlay */}
          <div
            className="absolute transition-portal"
            style={{
              left: transitionData.originRect ? `${transitionData.originRect.left + transitionData.originRect.width / 2}px` : '50%',
              top: transitionData.originRect ? `${transitionData.originRect.top + transitionData.originRect.height / 2}px` : '50%',
            }}
          />
          {/* Vortex/pull effect */}
          <div className="absolute inset-0 transition-vortex" />
        </div>
      )}
    </TransitionContext.Provider>
  );
}

export function usePageTransition() {
  const context = useContext(TransitionContext);
  if (!context) {
    throw new Error("usePageTransition must be used within PageTransitionProvider");
  }
  return context;
}
