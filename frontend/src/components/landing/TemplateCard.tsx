import { Card, CardBody, CardHeader } from "@heroui/react";
import { SparklesIcon } from "@heroicons/react/24/solid";

interface TemplateCardProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
  tags?: string[];
  difficulty?: "Easy" | "Medium" | "Hard";
  duration?: string;
}

export default function TemplateCard({ 
  title, 
  description, 
  icon,
  tags = [],
  difficulty = "Easy",
  duration = "2-3 min"
}: TemplateCardProps) {
  const difficultyColors = {
    Easy: "text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/30",
    Medium: "text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-900/30",
    Hard: "text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/30"
  };

  return (
    <Card className="group hover:scale-110 transition-all duration-300 cursor-pointer bg-gradient-surface glass-card ">
      <CardHeader className="flex gap-3 pb-2">
        <div className="p-2 rounded-lg bg-gradient-primary text-white">
          {icon || <SparklesIcon className="w-5 h-5" />}
        </div>
        <div className="flex flex-col flex-1">
          <p className="text-md font-semibold">{title}</p>
          <div className="flex gap-2 mt-1">
            <span className={`text-xs px-2 py-0.5 rounded-full ${difficultyColors[difficulty]}`}>
              {difficulty}
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
              {duration}
            </span>
          </div>
        </div>
      </CardHeader>
      <CardBody className="pt-0">
        <p className="text-sm text-default-500 line-clamp-2">{description}</p>
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-3">
            {tags.map((tag, index) => (
              <span 
                key={index}
                className="text-xs px-2 py-1 rounded-md bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
      </CardBody>
    </Card>
  );
}
