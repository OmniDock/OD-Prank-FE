let sharedAudioContext: AudioContext | null = null;
const elementSourceMap = new WeakMap<HTMLMediaElement, MediaElementAudioSourceNode>();
const connectedToDestination = new WeakSet<MediaElementAudioSourceNode>();

export interface AnalyserOptions {
  fftSize?: number;
  smoothingTimeConstant?: number;
}

export function getOrCreateAnalyser(
  audioEl: HTMLMediaElement,
  options: AnalyserOptions = {}
) {
  if (!sharedAudioContext) {
    const Ctx: typeof AudioContext = (window as any).AudioContext || (window as any).webkitAudioContext;
    sharedAudioContext = new Ctx();
  }
  const ctx = sharedAudioContext;

  let source = elementSourceMap.get(audioEl);
  if (!source) {
    source = ctx.createMediaElementSource(audioEl);
    elementSourceMap.set(audioEl, source);
  }

  const analyser = ctx.createAnalyser();
  analyser.fftSize = options.fftSize ?? 2048;
  analyser.smoothingTimeConstant = options.smoothingTimeConstant ?? 0.8;

  try {
    source.connect(analyser);
  } catch {}

  try {
    if (!connectedToDestination.has(source)) {
      source.connect(ctx.destination);
      connectedToDestination.add(source);
    }
  } catch {}

  return { ctx, source, analyser };
}


