export const billingKeys = {
  plans: () => ["billing", "plans"] as const,
  plan: (planId: string) => ["billing", "plan", planId] as const,
  subscriptions: () => ["billing", "subscriptions"] as const,
  subscription: (subscriptionId: string) => ["billing", "subscription", subscriptionId] as const,
  profile: () => ["billing", "profile"] as const,
};
