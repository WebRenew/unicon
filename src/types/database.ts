export type SubscriptionStatus = "active" | "canceled" | "past_due";
export type SubscriptionPlan = "free" | "pro";

export interface Profile {
  id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
}

export interface Subscription {
  id: string;
  user_id: string;
  status: SubscriptionStatus;
  plan: SubscriptionPlan;
  provider: string | null;
  provider_subscription_id: string | null;
  provider_customer_id: string | null;
  current_period_end: string | null;
  created_at: string;
  updated_at: string;
}

export interface Bundle {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  is_public: boolean;
  share_slug: string | null;
  stroke_preset: string | null;
  normalize_strokes: boolean;
  target_stroke_width: number | null;
  icons: BundleIcon[];
  icon_count: number;
  created_at: string;
  updated_at: string;
}

export interface BundleIcon {
  id: string;
  name: string;
  normalizedName: string;
  sourceId: string;
  svg: string;
  viewBox: string;
  strokeWidth?: string | null;
  defaultFill?: boolean;
  defaultStroke?: boolean;
}

export interface UserWithSubscription {
  profile: Profile;
  subscription: Subscription;
  isPro: boolean;
}
