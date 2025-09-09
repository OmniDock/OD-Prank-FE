export enum SubscriptionTypes {
    WEEKLY = "weekly",
    MONTHLY = "monthly",
    YEARLY = "yearly"
  }

export enum ProductNames {
    SUBSCRIPTION = "Subscription",
}

export type Plan = {
    id: string;
    name: string;
    tagline: string;
    price: number;
    interval: string;
    features: string[];
    ctaLabel: string;
    ctaHref: string;
    popular?: boolean;
  };