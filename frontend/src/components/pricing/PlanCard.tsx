import { Card, CardBody, CardFooter, CardHeader } from "@heroui/card";
import { Button } from "@heroui/button";
import { Plan, ProductTypes } from "@/types/products";
import { useState, useEffect } from "react";
import { Input } from "@heroui/input";

export default function PlanCard({
  plan,
  onPlanSelect,
  disabled = false,
}: {
  plan: Plan;
  billing: "monthly" | "annual";
  onPlanSelect?: (plan: Plan, amount: number) => void;
  disabled?: boolean;
}) {
  const [amount, setAmount] = useState(1);
  const isSubscription = plan.type === ProductTypes.SUBSCRIPTION;
  const isDisabled = disabled && isSubscription;    
  useEffect(() => {
    console.log(amount);
  }, [amount]);
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
        <h3 className="text-xl font-bold">{plan.displayName}</h3>
        <p className="text-sm text-default-500">{plan.tagline}</p>
      </CardHeader>
      <CardBody className="flex flex-col gap-4 px-6">
        <div className="flex flex-col">
          <span className="text-4xl font-extrabold tracking-tight">{plan.price} € / {plan.interval}</span> 
          {!isSubscription && <span className="text-sm text-default-500">insg. {(plan.price * amount).toFixed(2)}€</span>}
        </div>

        <ul className="space-y-2">
          {plan.features.map((f) => (
            <li key={f} className="flex items-start gap-2">
              <span className="mt-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-green-500/15 text-green-600 text-xs">✓</span>
              <span className="text-sm">{f}</span>
            </li>
          ))}
        </ul>
         {!isSubscription && (
          <div className="flex items-center gap-2 text-sm">
            <span>Hol dir</span>
            <Input
              type="number"
              value={amount.toString()}
              defaultValue={'1'}
              onChange={(e) => setAmount(Number(e.target.value))}
              min={1}
              size="sm"
              className="w-16"
              isInvalid={false}
              errorMessage=""
              validationState="valid"
            />
            <span>Pranks</span>
          </div>
        )}
      </CardBody>
      <CardFooter className="pt-0">
        <Button
          color="primary"
          variant={plan.popular ? "solid" : "bordered"}
          className={plan.popular ? "bg-gradient-primary w-full" : "w-full"}
          onClick={() => onPlanSelect?.(plan, isSubscription ? 1 : amount)}
          isDisabled={isDisabled }
        >
        {isDisabled ? "Du hast bereits ein Abonnement." : 'Jetzt kaufen'}
        </Button>
      </CardFooter>
    </Card>
  );
}


