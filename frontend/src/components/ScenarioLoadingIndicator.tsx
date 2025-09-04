import { ArrowPathIcon } from '@heroicons/react/24/outline';

export default function ScenarioLoadingIndicator() {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <ArrowPathIcon className="h-10 w-10 animate-spin text-blue-500 mb-4" />
      <span className="text-lg text-gray-700 font-medium">Szenario wird erstellt...</span>
    </div>
  );
}
