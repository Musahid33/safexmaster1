export type Language = 'en' | 'hi' | 'or' | 'bn' | 'pa' | 'mr';
export type ReportType = 'Near Miss' | 'Hazard' | 'Safety Observation' | 'Unsafe Condition' | 'Unsafe Act' | 'Feedback' | 'Grievance' | 'Speak Up' | 'Suggestion';
export type ReportStatus = 'Open' | 'In Progress' | 'Closed';

/**
 * Hazard classification. Fixed taxonomy shared by the report form, the admin console and
 * (once reporting is connected) the `reports.category` column, so it is defined once here.
 */
export type HazardCategory =
  | 'Physical'
  | 'Chemical'
  | 'Electrical'
  | 'Mechanical'
  | 'Fire'
  | 'Ergonomical'
  | 'Environment'
  | 'Biological'
  | 'Other';

export const HAZARD_CATEGORIES: readonly HazardCategory[] = [
  'Physical', 'Chemical', 'Electrical', 'Mechanical', 'Fire', 'Ergonomical', 'Environment', 'Biological', 'Other'
] as const;

/**
 * Five-point risk rating (1 = insignificant … 5 = critical). The number is the stored value;
 * the label is presentation only, so reports stay comparable across languages.
 */
export type SeverityLevel = 1 | 2 | 3 | 4 | 5;

export type SeverityOption = { value: SeverityLevel; en: string; hi: string };

export const SEVERITY_LEVELS: readonly SeverityOption[] = [
  { value: 1, en: 'Insignificant', hi: 'नगण्य' },
  { value: 2, en: 'Minor', hi: 'मामूली' },
  { value: 3, en: 'Moderate', hi: 'मध्यम' },
  { value: 4, en: 'Major', hi: 'गंभीर' },
  { value: 5, en: 'Critical', hi: 'अति गंभीर' }
] as const;
/**
 * Why the employee directory could not answer. Shown to operators instead of the generic
 * "keys are not configured" hint, which was wrong whenever the database was simply down.
 */
export type DirectoryUnavailableReason =
  | 'keys_missing'
  | 'database_unreachable'
  | 'tenant_unresolved'
  | 'no_sites'
  | 'empty_directory'
  | 'snapshot_unreadable';

export type LifeSavingRule = { title: string; text: string };

/** Aggregated safety counters for one site, supplied by the tenant data source. */
export type SiteStats = {
  /** Whole days since the site's last recordable injury; null when the source does not track it. */
  daysWithoutInjury: number | null;
  nearMissCount: number;
  safetyObservationCount: number;
  trainingCount: number;
};

export type Site = {
  id: string;
  name: string;
  region: string;
  sosNumber: string | null;
  /** Site-specific published rules, supplied by the tenant when configured. */
  lifeSavingRules?: readonly LifeSavingRule[] | null;
  /** Per-site safety counters; null or absent until the data source supplies them. */
  stats?: SiteStats | null;
};
export type Employee = {
  id: string;
  empNo: string;
  name: string;
  designation: string;
  siteId: string;
  /** Non-sensitive work context released by the server lookup. Absent when unavailable. */
  department?: string | null;
  skillGrade?: string | null;
  /**
   * Safety credential number. Only present when the deployment has explicitly opted in
   * with the server-only SAFEX_PUBLIC_SAFETY_PASS flag; never returned by default.
   */
  safetyPassNo?: string | null;
  /** The public lookup only matches active employees; carried through for the badge. */
  active?: boolean;
};
export type ThemeMode = 'system' | 'light' | 'dark';
export type Palette = 'safex' | 'ocean' | 'forest' | 'contrast';
export type TenantFeatures = {
  voiceReporting: boolean;
  trainingManagement: boolean;
  library: boolean;
  circulars: boolean;
  rewardWall: boolean;
  pushNotifications: boolean;
};
export type TenantBranding = {
  companyName: string;
  companyAddress: string | null;
  email: string | null;
  mobile: string | null;
  logoPath: string | null;
  features: TenantFeatures;
  /** Optional admin-managed About Us and support fields; absent when the deployment does not publish them. */
  companyIntroduction?: string | null;
  services?: string[];
  website?: string | null;
  supportEmail?: string | null;
  supportMobile?: string | null;
  privacyPolicyUrl?: string | null;
  termsAndConditionsUrl?: string | null;
};
