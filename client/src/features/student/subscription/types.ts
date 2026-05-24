export interface PackageItem {
  id: number;
  label: string;
  subtitle: string;
  price: number;
  popular: boolean;
  status: 'active' | 'completed' | 'expired' | 'pending';
  balance: number;
  total_lessons: number;
  purchased_at: string | null;
  discipline: string;
}

export interface SubscriptionData {
  activePackage: PackageItem | null;
  packages: PackageItem[];
  discountPct: number;
}

export interface PackagePlan {
  id: number;
  name: string;
  total_lessons: number;
  price: number;
  description: string;
  is_active: boolean;
}
