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
