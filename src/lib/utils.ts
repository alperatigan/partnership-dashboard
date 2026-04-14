import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(
  amount: number,
  currency: string = 'USD',
  locale: string = 'en-US'
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(
  date: string | Date,
  options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }
): string {
  return new Intl.DateTimeFormat('en-US', options).format(new Date(date));
}

export function formatDateTime(date: string | Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function getCountryName(code: string): string {
  const countries: Record<string, string> = {
    PH: 'Philippines',
    VN: 'Vietnam',
    TH: 'Thailand',
  };
  return countries[code] || code;
}

export function getCountryFlag(code: string): string {
  const flags: Record<string, string> = {
    PH: '🇵🇭',
    VN: '🇻🇳',
    TH: '🇹🇭',
  };
  return flags[code] || '🌍';
}

export function calculateCommission(
  dealValue: number,
  tier: 'silver' | 'gold' | 'platinum'
): number {
  const percentages = {
    silver: 0.2,
    gold: 0.25,
    platinum: 0.3,
  };
  return dealValue * percentages[tier];
}

export function getTierFromDeals(quarterlyDeals: number): 'silver' | 'gold' | 'platinum' {
  if (quarterlyDeals >= 15) return 'platinum';
  if (quarterlyDeals >= 5) return 'gold';
  return 'silver';
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function generateId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}