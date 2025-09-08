import TemplateCard from "./TemplateCard";
import { 
  PhoneIcon, 
  BuildingOfficeIcon, 
  AcademicCapIcon,
  ShoppingCartIcon,
  TruckIcon,
  CakeIcon,
  HeartIcon,
  BriefcaseIcon,
  HomeIcon,
  UserGroupIcon,
  TicketIcon,
  GlobeAltIcon
} from "@heroicons/react/24/solid";

const templates = [
  {
    title: "Wrong Number Romance",
    description: "Someone thinks they're texting their crush but got the wrong number. Watch the confusion unfold!",
    icon: <HeartIcon className="w-5 h-5" />,
    tags: ["romantic", "confusion", "funny"],
    difficulty: "Easy" as const,
    duration: "3-5 min"
  },
  {
    title: "Pizza Order Mix-up",
    description: "A pizza place calls about a ridiculous order with 50 pizzas and unusual toppings.",
    icon: <ShoppingCartIcon className="w-5 h-5" />,
    tags: ["food", "delivery", "absurd"],
    difficulty: "Easy" as const,
    duration: "2-3 min"
  },
  {
    title: "Tech Support Nightmare",
    description: "An overly complicated tech support call where everything that can go wrong does go wrong.",
    icon: <BuildingOfficeIcon className="w-5 h-5" />,
    tags: ["tech", "frustrating", "office"],
    difficulty: "Medium" as const,
    duration: "5-7 min"
  },
  {
    title: "Surprise Party Planning",
    description: "Someone accidentally calls about planning a surprise party for the person they're calling.",
    icon: <CakeIcon className="w-5 h-5" />,
    tags: ["party", "surprise", "awkward"],
    difficulty: "Easy" as const,
    duration: "3-4 min"
  },
  {
    title: "Job Interview Gone Wrong",
    description: "A bizarre job interview for an increasingly ridiculous position with absurd requirements.",
    icon: <BriefcaseIcon className="w-5 h-5" />,
    tags: ["job", "professional", "bizarre"],
    difficulty: "Hard" as const,
    duration: "7-10 min"
  },
  {
    title: "Package Delivery Confusion",
    description: "A delivery driver insists on delivering a package but keeps getting the address hilariously wrong.",
    icon: <TruckIcon className="w-5 h-5" />,
    tags: ["delivery", "confusion", "persistent"],
    difficulty: "Medium" as const,
    duration: "4-6 min"
  },
  {
    title: "School Principal Call",
    description: "The 'principal' calls about your child's outrageous behavior at school (you don't have kids).",
    icon: <AcademicCapIcon className="w-5 h-5" />,
    tags: ["school", "authority", "mistaken"],
    difficulty: "Medium" as const,
    duration: "4-5 min"
  },
  {
    title: "Neighbor Complaints",
    description: "Your 'neighbor' calls to complain about increasingly absurd things happening in your yard.",
    icon: <HomeIcon className="w-5 h-5" />,
    tags: ["neighbor", "complaints", "escalating"],
    difficulty: "Easy" as const,
    duration: "3-5 min"
  },
  {
    title: "Celebrity Mix-up",
    description: "Someone thinks you're a celebrity and won't believe you when you deny it.",
    icon: <GlobeAltIcon className="w-5 h-5" />,
    tags: ["celebrity", "mistaken", "persistent"],
    difficulty: "Hard" as const,
    duration: "5-8 min"
  },
  {
    title: "Wedding Planner Chaos",
    description: "A wedding planner calls about your upcoming wedding with increasingly ridiculous requests.",
    icon: <UserGroupIcon className="w-5 h-5" />,
    tags: ["wedding", "planning", "chaos"],
    difficulty: "Medium" as const,
    duration: "5-7 min"
  },
  {
    title: "Concert Ticket Winner",
    description: "You've 'won' tickets to see a band that doesn't exist with increasingly weird requirements to claim.",
    icon: <TicketIcon className="w-5 h-5" />,
    tags: ["contest", "music", "scam"],
    difficulty: "Easy" as const,
    duration: "3-4 min"
  },
  {
    title: "Emergency Babysitter",
    description: "Someone desperately needs you to babysit their exotic pets thinking you're a pet sitter.",
    icon: <PhoneIcon className="w-5 h-5" />,
    tags: ["pets", "emergency", "mistaken"],
    difficulty: "Medium" as const,
    duration: "4-6 min"
  }
];

export default function TemplateContainer() {
  return (
    <section className="py-20 md:py-28">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="text-gradient">Beliebte Szenarien</span>
          </h2>
          <p className="text-lg text-default-600 max-w-2xl mx-auto">
            Wähle aus unserer Sammlung an lustigen Prank-Szenarien oder erstelle dein eigenes Setup
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-8">
          {templates.map((template, index) => (
            <TemplateCard
              key={index}
              title={template.title}
              description={template.description}
              icon={template.icon}
              tags={template.tags}
              difficulty={template.difficulty}
              duration={template.duration}
            />
          ))}
        </div>

        <div className="text-center mt-12">
          <button className="px-8 py-3 rounded-full bg-gradient-primary text-white font-semibold hover:scale-105 transition-transform">
            Alle Szenarien anzeigen
          </button>
        </div>
      </div>
    </section>
  );
}
