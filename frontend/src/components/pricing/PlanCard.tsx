import { Card, CardBody, CardFooter, CardHeader } from "@heroui/card";
import { Button } from "@heroui/button";
import { Link } from "@heroui/link";

export type Plan = {
  id: string;
  name: string;
  tagline: string;
  priceMonthly: number | null;
  priceAnnual: number | null;
  features: string[];
  ctaLabel: string;
  ctaHref: string;
  popular?: boolean;
};

export default function PlanCard({
  plan,
  billing,
}: {
  plan: Plan;
  billing: "monthly" | "annual";
}) {
  const price =
    billing === "annual" ? plan.priceAnnual : plan.priceMonthly;

  const priceLabel =
    price === null
      ? "Custom"
      : `$${price}${billing === "annual" ? "/yr" : "/mo"}`;

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
          {plan.priceMonthly !== null && billing === "annual" && (
            <span className="text-xs text-default-500">billed annually</span>
          )}
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
          as={Link}
          href={plan.ctaHref}
          color="primary"
          variant={plan.popular ? "solid" : "bordered"}
          className={plan.popular ? "bg-gradient-primary w-full" : "w-full"}
        >
          {plan.ctaLabel}
        </Button>
      </CardFooter>
    </Card>
  );
}


