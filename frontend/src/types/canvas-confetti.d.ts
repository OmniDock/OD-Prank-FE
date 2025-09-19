declare module 'canvas-confetti' {
  interface ConfettiOptions {
    particleCount?: number;
    angle?: number;
    spread?: number;
    startVelocity?: number;
    decay?: number;
    gravity?: number;
    scalar?: number;
    ticks?: number;
    origin?: { x?: number; y?: number };
    colors?: string[];
    zIndex?: number;
    shapes?: string[];
    drift?: number;
  }

  const confetti: (options?: ConfettiOptions) => void;
  export default confetti;
}


