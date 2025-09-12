import { Card, CardBody, CardFooter, CardHeader } from "@heroui/card";
import { Button } from "@heroui/button";
import { Plan } from "@/types/products";


export default function PlanCard({
  plan,
  billing,
  onPlanSelect,
}: {
  plan: Plan;
  billing: "monthly" | "annual";
  onPlanSelect?: (plan: Plan) => void;
}) {
  // Use the plan's price and interval if available, otherwise fall back to billing toggle
  const price = plan.price !== undefined ? plan.price : null;
  // const price = (plan as any).price !== undefined ? (plan as any).price : 
  //   (billing === "annual" ? plan.priceAnnual : plan.priceMonthly);
  
  const interval = plan.interval;

  const priceLabel =
    price === null
      ? "Custom"
      : interval === "week" || interval === "month"
      ? `$${price}/${interval === "week" ? "Woche" : "Monat"}`
      : `$${price}`;

  return (
    <Card className={["relative h-full border border-default-200/40",
      plan.popular ? "shadow-lg shadow-purple-500/20 border-purple-500/40" : ""
    ].join(" ")}>
      {plan.popular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-xs px-2 py-1 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow">
          Most Popular
        </div>
      )}
      <CardHeader className="flex flex-col items-start gap-1">
        <h3 className="text-xl font-bold">{plan.name}</h3>
        <p className="text-sm text-default-500">{plan.tagline}</p>
      </CardHeader>
      <CardBody className="flex flex-col gap-4">
        <div className="flex items-baseline gap-2">
          <span className="text-4xl font-extrabold tracking-tight">{priceLabel}</span>
        </div>

        <ul className="space-y-2">
          {plan.features.map((f) => (
            <li key={f} className="flex items-start gap-2">
              <span className="mt-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-green-500/15 text-green-600 text-xs">✓</span>
              <span className="text-sm">{f}</span>
            </li>
          ))}
        </ul>
      </CardBody>
      <CardFooter className="pt-0">
        <Button
          color="primary"
          variant={plan.popular ? "solid" : "bordered"}
          className={plan.popular ? "bg-gradient-primary w-full" : "w-full"}
          onClick={() => onPlanSelect?.(plan)}
        >
          {plan.ctaLabel}
        </Button>
      </CardFooter>
    </Card>
  );
}


