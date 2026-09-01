import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date) {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatPercent(value: number) {
  return `${Math.round(value * 100)}%`;
}

export const CRIME_CATEGORIES = [
  "Murder", "Robbery", "Burglary", "Cyber Crime", "Fraud", "Kidnapping",
  "Domestic Violence", "Drug Crime", "Vehicle Theft", "Human Trafficking",
  "Extortion", "Arson", "Assault", "Financial Crime", "Terror Related Incident", "Other",
];

export const SIMULATOR_SAMPLE_CASE =
  "At approximately 10:30 PM, a shop owner was found unconscious inside his store. The front door was locked when the police arrived. CCTV footage showed his employee entering the store at 9:45 PM. The employee later stated that he had left at 9:30 PM. A rear window was found damaged, and some cash was missing from the counter. A neighboring shopkeeper reported hearing an argument shortly before 10 PM.";

export const AI_DISCLAIMER =
  "AI outputs are investigative assistance only. They do not constitute proof of guilt and require human verification.";
