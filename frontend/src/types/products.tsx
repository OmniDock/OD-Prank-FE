export enum SubscriptionTypes {
    WEEKLY = "weekly",
    MONTHLY = "monthly",
    YEARLY = "yearly"
  }

export enum ProductTypes {
    SUBSCRIPTION = "subscription",
    ONE_TIME = "oneTime",
}

export type Plan = {
    id: string;
    tagline: string;
    price: number;
    interval: string;
    features: string[];
    ctaLabel: string;
    ctaHref: string;
    popular?: boolean;
    type: string;
    displayName: string;
  };

export const Products = {
  Subscriptions: {
    'weekly' : {label: 'Woche', displayName : 'Wöchentliches Abo'},
    'monthly' : {label: 'Monat', displayName : 'Monatliches Abo'},
  },
  OneTimeProducts: {
    'single' : {label: 'Prank', displayName : 'Einzelne Pranks'},
  },
}
  