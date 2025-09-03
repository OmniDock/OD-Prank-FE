import { Chip } from "@heroui/react";

export default function Stats() {
  return (
    <div className="flex flex-row gap-4 justify-center items-center w-full">
      <Chip 
        color="primary" 
        variant="flat"
        className="px-4 py-5"
      >
        <div className="flex flex-row justify-center items-center gap-2">
          <span className="text-gradient font-semibold text-lg">50K+</span> <span className="font-semibold">Calls made</span>
        </div>
      </Chip>
      
      <Chip 
        color="primary" 
        variant="flat"
        className="px-4 py-5"
      >
        <div className="flex flex-row justify-center items-center gap-2">
          <span className="text-gradient font-semibold text-lg">25+</span> <span className="font-semibold">Voices</span>
        </div>
      </Chip>
      
      <Chip 
        color="primary" 
        variant="flat"
        className="px-4 py-5"
      >
        <div className="flex flex-row justify-center items-center gap-2">
          <span className="text-gradient font-semibold text-lg">99%</span> <span className="font-semibold">Laughs Guaranteed</span>
        </div>
      </Chip>
    </div>
  );
}
