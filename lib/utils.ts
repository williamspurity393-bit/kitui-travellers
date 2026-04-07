import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function fmtKES(amount: number): string {
  return `KES ${amount.toLocaleString("en-KE")}`;
}

export function fmtDuration(minutes: number): string {
  const h = Math.floor(Math.abs(minutes) / 60);
  const m = Math.abs(minutes) % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

export function fmtDate(
  timestamp: number,
  options: Intl.DateTimeFormatOptions = { day: "numeric", month: "short", year: "numeric" }
): string {
  return new Date(timestamp).toLocaleDateString("en-KE", options);
}

export function fmtDateTime(timestamp: number): string {
  return new Date(timestamp).toLocaleString("en-KE", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function firstName(name: string): string {
  return name.trim().split(/\s+/)[0] ?? name;
}

export function initials(
  name: string | null | undefined,
  email: string | null | undefined
): string {
  if (name) {
    const parts = name.trim().split(/\s+/);
    return parts.length >= 2
      ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
      : parts[0].slice(0, 2).toUpperCase();
  }
  if (email) return email[0].toUpperCase();
  return "KT";
}

export function displayName(profile: {
  fullName?: string | null;
  email?: string | null;
  phone?: string | null;
}): string {
  if (profile.fullName) return profile.fullName;
  if (profile.email) return profile.email.split("@")[0].replace(/[._-]/g, " ");
  if (profile.phone) return profile.phone;
  return "Kitui Traveller";
}

export function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export function formatMins(mins: number): string {
  if (Math.abs(mins) < 1) return "now";
  const abs = Math.abs(Math.round(mins));
  const h = Math.floor(abs / 60);
  const m = abs % 60;
  const sign = mins < 0 ? "ago" : "in";
  if (h > 0) return `${h}h ${m}m ${sign}`;
  return `${m}m ${sign}`;
}

export function toApiPhone(phone: string): string {
  const d = phone.replace(/\D/g, "");
  if (d.startsWith("254") && d.length === 12) return d;
  if (d.startsWith("0") && d.length === 10) return "254" + d.slice(1);
  if (d.length === 9) return "254" + d;
  return d;
}

export function formatPhoneDisplay(raw: string): string {
  const d = raw.replace(/\D/g, "");
  const local = d.startsWith("254") ? "0" + d.slice(3) : d;
  if (local.length <= 4) return local;
  if (local.length <= 7) return `${local.slice(0, 4)} ${local.slice(4)}`;
  return `${local.slice(0, 4)} ${local.slice(4, 7)} ${local.slice(7, 10)}`;
}

export function isValidKenyanPhone(phone: string): boolean {
  return /^2547\d{8}$/.test(toApiPhone(phone));
}
