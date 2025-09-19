import { Card, CardBody, CardFooter, CardHeader } from "@heroui/card";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { CheckCircleIcon, SparklesIcon, StarIcon } from "@heroicons/react/24/outline";
import { useMemo, useState } from "react";

import { Plan, ProductTypes } from "@/types/products";

type Palette = {
  gradient: string;
  border: string;
  highlightBar: string;
  badgeBg: string;
  badgeText: string;
  iconBg: string;
  icon: string;
  button: string;
  price: string;
  defaultBadge: string;
};

const paletteConfig: Record<string, Palette> = {
  popular: {
    gradient: "from-emerald-500/12 via-emerald-400/6 to-transparent",
    border: "border-emerald-400/40",
    highlightBar: "from-emerald-400 via-emerald-500 to-teal-500",
    badgeBg: "bg-emerald-500/15",
    badgeText: "text-emerald-600",
    iconBg: "bg-emerald-500/15",
    icon: "text-emerald-500",
    button: "from-emerald-500 via-teal-500 to-sky-500",
    price: "text-emerald-600 dark:text-emerald-400",
    defaultBadge: "Beliebteste Wahl",
  },
  starter: {
    gradient: "from-violet-500/12 via-indigo-400/6 to-transparent",
    border: "border-violet-400/50",
    highlightBar: "from-violet-400 via-indigo-500 to-blue-500",
    badgeBg: "bg-violet-500/15",
    badgeText: "text-violet-600",
    iconBg: "bg-violet-500/15",
    icon: "text-violet-500",
    button: "from-violet-500 via-indigo-500 to-blue-500",
    price: "text-violet-600 dark:text-violet-400",
    defaultBadge: "Perfekt für Solo",
  },
  pro: {
    gradient: "from-sky-500/12 via-blue-400/6 to-transparent",
    border: "border-sky-400/50",
    highlightBar: "from-sky-400 via-blue-500 to-indigo-500",
    badgeBg: "bg-sky-500/15",
    badgeText: "text-sky-600",
    iconBg: "bg-sky-500/15",
    icon: "text-sky-500",
    button: "from-sky-500 via-blue-500 to-indigo-500",
    price: "text-sky-600 dark:text-sky-400",
    defaultBadge: "Für Teams",
  },
  weekly: {
    gradient: "from-amber-500/14 via-orange-400/6 to-transparent",
    border: "border-amber-400/50",
    highlightBar: "from-amber-400 via-orange-500 to-amber-500",
    badgeBg: "bg-amber-500/15",
    badgeText: "text-amber-600",
    iconBg: "bg-amber-500/15",
    icon: "text-amber-500",
    button: "from-amber-500 via-orange-500 to-rose-500",
    price: "text-amber-600 dark:text-amber-400",
    defaultBadge: "Wöchentlich",
  },
  single: {
    gradient: "from-amber-500/14 via-orange-400/6 to-transparent",
    border: "border-amber-400/50",
    highlightBar: "from-amber-400 via-orange-500 to-amber-500",
    badgeBg: "bg-amber-500/15",
    badgeText: "text-amber-600",
    iconBg: "bg-amber-500/15",
    icon: "text-amber-500",
    button: "from-amber-500 via-orange-500 to-rose-500",
    price: "text-amber-600 dark:text-amber-400",
    defaultBadge: "Flexibel",
  },
  subscription: {
    gradient: "from-indigo-500/12 via-purple-400/6 to-transparent",
    border: "border-indigo-400/40",
    highlightBar: "from-indigo-400 via-purple-500 to-violet-500",
    badgeBg: "bg-indigo-500/15",
    badgeText: "text-indigo-600",
    iconBg: "bg-indigo-500/15",
    icon: "text-indigo-500",
    button: "from-indigo-500 via-purple-500 to-violet-500",
    price: "text-indigo-600 dark:text-indigo-400",
    defaultBadge: "Abo",
  },
  oneTime: {
    gradient: "from-rose-500/14 via-pink-400/6 to-transparent",
    border: "border-rose-400/50",
    highlightBar: "from-rose-400 via-pink-500 to-amber-500",
    badgeBg: "bg-rose-500/15",
    badgeText: "text-rose-600",
    iconBg: "bg-rose-500/15",
    icon: "text-rose-500",
    button: "from-rose-500 via-pink-500 to-amber-500",
    price: "text-rose-600 dark:text-rose-400",
    defaultBadge: "Einmalig",
  },
  default: {
    gradient: "from-slate-500/12 via-slate-400/6 to-transparent",
    border: "border-default-200/60",
    highlightBar: "from-slate-400 via-slate-500 to-slate-600",
    badgeBg: "bg-default-200/60",
    badgeText: "text-default-600",
    iconBg: "bg-default-200/60",
    icon: "text-default-600",
    button: "from-default-500 via-default-600 to-default-700",
    price: "text-foreground",
    defaultBadge: "Beliebt",
  },
};

const intervalMap: Record<string, string> = {
  month: "Monat",
  monthly: "Monat",
  year: "Jahr",
  yearly: "Jahr",
  week: "Woche",
  weekly: "Woche",
  single: "Pro Prank"
};

export default function PlanCard({
  plan,
  onPlanSelect,
  disabled = false,
  defaultAmount,
}: {
  plan: Plan;
  billing: "monthly" | "annual";
  onPlanSelect?: (plan: Plan, amount: number) => void;
  disabled?: boolean;
  defaultAmount?: number;
}) {
  const [amount, setAmount] = useState(defaultAmount ?? 1);
  const isSubscription = plan.type === ProductTypes.SUBSCRIPTION;
  const isDisabled = disabled && isSubscription;

  const palette = useMemo(() => {
    const planId = (plan.id || "").toLowerCase();
    // Only weekly uses orange; everything else uses primary/purple
    if (planId === "weekly") {
      return paletteConfig.weekly;
    }
    return paletteConfig.subscription;
  }, [plan]);

  const badgeLabel = useMemo(() => {
    if (plan.popular) return "Beliebteste Wahl";
    const planId = (plan.id || "").toLowerCase();
    if (planId === "weekly") return "Wöchentlich";
    if (plan.type === ProductTypes.ONE_TIME) return "Einmalig";
    return "Abo";
  }, [plan]);
  const intervalLabel = useMemo(() => {
    if (!isSubscription || !plan.interval || typeof plan.interval !== "string") {
      return undefined;
    }
    const key = plan.interval.toLowerCase();
    return intervalMap[key] ?? plan.interval;
  }, [isSubscription, plan.interval]);

  const formattedPrice = useMemo(
    () => new Intl.NumberFormat("de-DE", { minimumFractionDigits: 0 }).format(Number(plan.price ?? 0)),
    [plan.price]
  );

  const totalPrice = useMemo(() => {
    if (isSubscription) {
      return null;
    }
    const priceNumber = Number(plan.price ?? 0) * amount;
    return new Intl.NumberFormat("de-DE", { minimumFractionDigits: 0 }).format(priceNumber);
  }, [amount, isSubscription, plan.price]);

  const ctaLabel = isDisabled ? "Du hast bereits ein Abonnement." : isSubscription ? "Jetzt abonnieren" : "Credits sichern";
  const buttonClasses = [
    "w-full justify-center rounded-2xl font-semibold transition-colors",
    isDisabled ? "" : `bg-gradient-to-r ${palette.button} text-white hover:opacity-95`,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <Card
      className={`group relative flex h-full flex-col overflow-hidden rounded-[28px] border ${palette.border} bg-background/95 shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl dark:bg-default-50/60`}
    >
      <div className={`pointer-events-none absolute inset-0 -z-10 bg-gradient-to-br ${palette.gradient}`} aria-hidden />
      <div className={`pointer-events-none absolute inset-x-10 top-0 h-1 rounded-b-full bg-gradient-to-r ${palette.highlightBar}`} aria-hidden />
      <CardHeader className="flex flex-col gap-4 pb-0">
        <span className={`inline-flex w-fit items-center gap-2 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${palette.badgeBg} ${palette.badgeText}`}>
          {plan.popular ? (
            <SparklesIcon className={`h-4 w-4 ${palette.icon}`} />
          ) : (
            <StarIcon className={`h-4 w-4 ${palette.icon}`} />
          )}
          <span>{badgeLabel}</span>
        </span>
        <div className="space-y-2">
          <h3 className="text-2xl font-semibold text-foreground">{intervalMap[plan.displayName] || plan.displayName}</h3>
          {plan.tagline && <p className="text-sm text-default-500">{plan.tagline}</p>}
        </div>
      </CardHeader>
      <CardBody className="flex flex-col gap-6 px-6 pb-6">
        <div className="space-y-1">
          <div className={`text-4xl font-bold text-center tracking-tight ${palette.price}`}>{formattedPrice} €  {intervalLabel ? `/ ${intervalLabel}` : null}</div>
       
        </div>

        <ul className="flex flex-col gap-3 text-sm">
          {plan.features.map((feature) => (
            <li key={feature} className="flex items-center justify-start gap-3">
              <span className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full ${palette.iconBg}`}>
                <CheckCircleIcon className={`h-4 w-4 ${palette.icon}`} />
              </span>
              <span className="leading-snug text-default-600 dark:text-default-400">{feature}</span>
            </li>
          ))}
        </ul>

        {!isSubscription && (
          <div className="flex items-center gap-3 text-sm">
            <span className="font-medium text-default-600">Anzahl</span>
            <Input
              type="number"
              value={amount.toString()}
              onChange={(event) => {
                const parsed = Number(event.target.value);
                const nextValue = Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
                setAmount(nextValue);
              }}
              min={1}
              size="sm"
              className="w-24"
              classNames={{
                inputWrapper: "bg-background/70 border-default-200 group-hover:border-default-300",
                input: "text-center",
              }}
            />
          </div>
        )}
        {!isSubscription && totalPrice && (
          <div className="text-xs font-medium text-default-500">
            Gesamt bei {amount} Stück: {totalPrice} €
          </div>
        )}

      </CardBody>
      <CardFooter className="mt-auto pt-0">
        <Button
          color="primary"
          variant="solid"
          className={buttonClasses}
          onClick={() => onPlanSelect?.(plan, isSubscription ? 1 : amount)}
          isDisabled={isDisabled}
        >
          {ctaLabel}
        </Button>
      </CardFooter>
    </Card>
  );
}
