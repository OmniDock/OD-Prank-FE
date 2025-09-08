import { Spinner } from '@heroui/react';
import AnimatedBackground from './ui/AnimatedBackground';

export default function LoadingScreen({ message = 'Loading...' }: { message?: string }) {
  return (
    <div className="relative flex flex-col items-center justify-center min-h-[40vh] min-h-full py-12">
      <AnimatedBackground density={10} variant="mixed" className="opacity-30" />
      <div className="z-10 flex flex-col items-center">
        <Spinner size="lg" color="primary" variant='wave' className="mb-4" />
        <span className="text-lg text-gray-700 font-medium dark:text-gray-200 animate-pulse">{message}</span>
      </div>
    </div>
  );
}
