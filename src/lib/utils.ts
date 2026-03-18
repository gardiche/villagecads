import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Nettoie les scores et chiffres d'un texte
 * Supprime : 8/100, 70%, Score : 15, etc.
 */
export function cleanText(text: string | null | undefined): string {
  if (!text) return '';
  return text
    // Supprime "Score : 15" ou "Score: 15"
    .replace(/Score\s*:\s*\d+/gi, '')
    // Supprime "8/100" ou "8 / 100"
    .replace(/\d+\s*\/\s*\d+/g, '')
    // Supprime "70%" ou "70 %"
    .replace(/\d+\s*%/g, '')
    // Supprime chiffres isolés en début de phrase
    .replace(/^\s*\d+\s+/gm, '')
    // Nettoyage espaces multiples
    .replace(/\s{2,}/g, ' ')
    .trim();
}
