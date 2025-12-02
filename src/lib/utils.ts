import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatNumber(num: number | string | undefined): string {
  if (num === undefined || num === null) return '0.00';
  const number = typeof num === 'string' ? parseFloat(num) : num;
  
  if (isNaN(number)) return '0.00';

  if (number === 0) return '0.00';
  
  if (number > 0 && number < 0.0001) {
    return number.toExponential(2);
  }

  if (number > 1000000) {
    return (number / 1000000).toFixed(2) + 'M';
  }

  if (number > 1000) {
    return number.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  return number.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 6,
  });
}
