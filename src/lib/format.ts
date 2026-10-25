import type { GameStatus } from "./espn";

const TIME_ZONE = "Europe/Madrid";

export function cn(
  ...classes: (string | false | null | undefined)[]
): string {
  return classes.filter(Boolean).join(" ");
}

export function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function formatDateLong(iso: string): string {
  return capitalize(
    new Intl.DateTimeFormat("ca-ES", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
      timeZone: TIME_ZONE,
    }).format(new Date(iso)),
  );
}

export function formatDateShort(iso: string): string {
  return new Intl.DateTimeFormat("ca-ES", {
    day: "numeric",
    month: "short",
    timeZone: TIME_ZONE,
  }).format(new Date(iso));
}

export function formatTime(iso: string): string {
  return new Intl.DateTimeFormat("ca-ES", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: TIME_ZONE,
  }).format(new Date(iso));
}

export function todayIso(timeZone = TIME_ZONE): string {
  return new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone,
  }).format(new Date());
}

export function isValidIsoDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value));
}

export function shiftIsoDate(iso: string, days: number): string {
  const date = new Date(`${iso}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export function espnDate(iso: string): string {
  return iso.replaceAll("-", "");
}

export function gameStatusLabel(status?: GameStatus): string {
  if (!status) return "";
  if (status.type.state === "post" || status.type.completed) return "Final";
  if (status.type.state === "in") {
    if (status.type.description === "Halftime") return "Descans";
    const period = status.period ?? 1;
    return `${period}Q · ${status.displayClock ?? ""}`.trim();
  }
  return "Programat";
}

export function gameStatusTone(status?: GameStatus): string {
  if (!status) return "text-zinc-400";
  if (status.type.state === "in") return "text-orange-400";
  if (status.type.state === "post" || status.type.completed)
    return "text-zinc-400";
  return "text-emerald-400";
}

export function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.round(diff / 60000);
  if (minutes < 1) return "ara mateix";
  if (minutes < 60) return `fa ${minutes} min`;

  const hours = Math.round(minutes / 60);
  if (hours < 24) return `fa ${hours} h`;

  const days = Math.round(hours / 24);
  if (days < 7) return `fa ${days} ${days === 1 ? "dia" : "dies"}`;

  return new Intl.DateTimeFormat("ca-ES", {
    day: "numeric",
    month: "short",
  }).format(new Date(iso));
}

export function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

export function decimal(value?: number, digits = 1): string {
  if (value === undefined || Number.isNaN(value)) return "—";
  return value.toFixed(digits);
}

export function percent(value?: number, digits = 1): string {
  if (value === undefined || Number.isNaN(value)) return "—";
  return `${value.toFixed(digits)}%`;
}

export function winPercent(value?: number): string {
  if (value === undefined || Number.isNaN(value)) return "—";
  return value.toFixed(3).replace(/^0/, "");
}

const POSITION_LABELS: Record<string, string> = {
  PG: "Base",
  SG: "Escorta",
  SF: "Aler",
  PF: "Ala-pivot",
  C: "Pivot",
  G: "Escorta",
  F: "Aler",
};

export function positionLabel(abbreviation?: string): string {
  if (!abbreviation) return "—";
  return POSITION_LABELS[abbreviation] ?? abbreviation;
}

const STAT_LABELS: Record<string, string> = {
  avgPoints: "Punts per partit",
  avgRebounds: "Rebots per partit",
  avgAssists: "Assistències per partit",
  avgSteals: "Robatoris per partit",
  avgBlocks: "Taps per partit",
  avgMinutes: "Minuts per partit",
  fieldGoalPct: "Tirs de camp",
  threePointFieldGoalPct: "Triples",
  freeThrowPct: "Tirs lliures",
  avgTurnovers: "Pèrdues per partit",
};

export function statLabel(name: string, fallback?: string): string {
  return STAT_LABELS[name] ?? fallback ?? name;
}

export function seasonLabel(year?: number): string {
  if (!year) return "actual";
  return `${year - 1}–${String(year).slice(2)}`;
}

export function splitSchedule<T extends { date: string }>(
  events: T[],
  past = 5,
  upcoming = 5,
): { played: T[]; next: T[] } {
  const now = Date.now();
  return {
    played: events
      .filter((event) => new Date(event.date).getTime() < now)
      .slice(-past)
      .reverse(),
    next: events
      .filter((event) => new Date(event.date).getTime() >= now)
      .slice(0, upcoming),
  };
}
