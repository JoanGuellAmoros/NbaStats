const TIME_ZONE = "Europe/Madrid";
const NBA_TIME_ZONE = "America/New_York";

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
    }).format(new Date(iso.length === 10 ? `${iso}T12:00:00Z` : iso)),
  );
}

export function formatDateShort(iso: string): string {
  return new Intl.DateTimeFormat("ca-ES", {
    day: "numeric",
    month: "short",
    timeZone: TIME_ZONE,
  }).format(new Date(iso.length === 10 ? `${iso}T12:00:00Z` : iso));
}

export function formatDateMedium(iso: string): string {
  return new Intl.DateTimeFormat("ca-ES", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: TIME_ZONE,
  }).format(new Date(iso.length === 10 ? `${iso}T12:00:00Z` : iso));
}

export function formatTime(iso: string): string {
  return new Intl.DateTimeFormat("ca-ES", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: TIME_ZONE,
  }).format(new Date(iso));
}

export function formatDateTime(timestamp: number): string {
  return new Intl.DateTimeFormat("ca-ES", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: TIME_ZONE,
  }).format(new Date(timestamp));
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

export function nbaCalendarDate(iso: string): string {
  if (isValidIsoDate(iso)) return iso;

  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso.slice(0, 10);

  return new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: NBA_TIME_ZONE,
  }).format(date);
}

export function isPastDay(day: string): boolean {
  return day < todayIso();
}

export function shiftIsoDate(iso: string, days: number): string {
  const date = new Date(`${iso}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export function dateRange(center: string, days: number): string[] {
  const dates: string[] = [];
  for (let offset = -days; offset <= days; offset += 1) {
    dates.push(shiftIsoDate(center, offset));
  }
  return dates;
}

export function espnDate(iso: string): string {
  return iso.replaceAll("-", "");
}

export function seasonLabel(year?: number): string {
  if (!year) return "actual";
  return `${year - 1}–${String(year).slice(2)}`;
}

export function timeAgo(timestamp: number): string {
  const diff = Date.now() - timestamp;
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
  }).format(new Date(timestamp));
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

export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const index = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1,
  );
  const value = bytes / 1024 ** index;
  const formatted = value.toLocaleString("ca-ES", {
    maximumFractionDigits: value >= 10 || index === 0 ? 0 : 1,
  });
  return `${formatted} ${units[index]}`;
}

export function decimal(value?: number, digits = 1): string {
  if (value === undefined || Number.isNaN(value)) return "—";
  return value.toLocaleString("ca-ES", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

export function percent(value?: number, digits = 1): string {
  if (value === undefined || Number.isNaN(value)) return "—";
  return `${decimal(value, digits)}%`;
}

export function caNumber(value?: string): string {
  if (value === undefined || value === null || value === "") return "—";
  return value.replace(/(\d)\.(\d)/g, "$1,$2");
}

export function winPct(value?: string): string {
  if (!value) return "—";
  const numeric = Number(value.startsWith(".") ? `0${value}` : value);
  if (!Number.isFinite(numeric)) return value;
  return `${decimal(numeric * 100)}%`;
}

export function streakLabel(value?: string): string {
  if (!value) return "—";
  const match = /^([WL])(\d+)$/i.exec(value.trim());
  if (!match) return value;
  return `${match[1].toUpperCase() === "W" ? "V" : "D"}${match[2]}`;
}

export function ordinal(value: number): string {
  if (value === 1) return "1r";
  if (value === 2) return "2n";
  if (value === 3) return "3r";
  if (value === 4) return "4t";
  return `${value}è`;
}

export function rankLabel(raw?: string): string {
  if (!raw) return "—";
  const tied = /^tied-(\d+)/i.exec(raw);
  const plain = /^(\d+)/.exec(raw);
  const numeric = tied?.[1] ?? plain?.[1];
  if (!numeric) return raw;
  return `${ordinal(Number(numeric))}${tied ? " (ex aequo)" : ""}`;
}

const DIVISIONS: Record<string, string> = {
  atlantic: "Atlàntic",
  central: "Central",
  southeast: "Sud-est",
  pacific: "Pacífic",
  northwest: "Nord-oest",
  southwest: "Sud-oest",
};

const CONFERENCES: Record<string, string> = {
  eastern: "Est",
  western: "Oest",
};

export function standingLabel(raw?: string): string {
  if (!raw) return "—";
  const match = /^(\d+)(?:st|nd|rd|th)\s+in\s+(?:the\s+)?(.+)$/i.exec(raw);
  if (!match) return raw;

  const place = ordinal(Number(match[1]));
  const group = match[2].trim();

  const division = /^(.+?)\s+Division$/i.exec(group);
  if (division) {
    const name = DIVISIONS[division[1].toLowerCase()] ?? division[1];
    return `${place} de la Divisió ${name}`;
  }

  const conference = /^(.+?)\s+Conference$/i.exec(group);
  if (conference) {
    const name = CONFERENCES[conference[1].toLowerCase()] ?? conference[1];
    return `${place} de la Conferència ${name}`;
  }

  return `${place} de ${group}`;
}

export function heightLabel(raw?: string): string {
  if (!raw) return "—";
  const imperial = /^(\d+)'\s*(\d+)/.exec(raw);
  if (!imperial) return raw;

  const inches = Number(imperial[1]) * 12 + Number(imperial[2]);
  const meters = (inches * 2.54) / 100;
  return `${meters.toLocaleString("ca-ES", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} m`;
}

export function weightLabel(raw?: string): string {
  if (!raw) return "—";
  const pounds = /^(\d+)\s*lbs?/i.exec(raw);
  if (!pounds) return raw;
  return `${Math.round(Number(pounds[1]) * 0.45359237)} kg`;
}

export function experienceLabel(raw?: string): string {
  if (!raw) return "—";
  if (/^rookie$/i.test(raw)) return "Novell";

  const season = /^(\d+)(?:st|nd|rd|th)\s+season$/i.exec(raw);
  if (season) return `${season[1]}a temporada`;

  return raw;
}

export function handLabel(raw?: string): string {
  if (!raw) return "—";
  if (/^right$/i.test(raw)) return "Dreta";
  if (/^left$/i.test(raw)) return "Esquerra";
  return raw;
}

export function draftLabel(raw?: string): string {
  if (!raw) return "—";
  const match =
    /^(\d{4}):\s*Rd\s*(\d+),\s*Pk\s*(\d+)\s*(?:\(([^)]+)\))?/i.exec(raw);
  if (!match) return raw;

  const round = Number(match[2]);
  const pick = match[3];
  const team = match[4] ? ` (${match[4]})` : "";
  return `${match[1]} · ${round}a ronda, elecció ${pick}${team}`;
}

export function birthDateLabel(raw?: string): string {
  if (!raw) return "—";
  const match = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(raw);
  if (!match) return raw;

  const date = new Date(
    Date.UTC(Number(match[3]), Number(match[1]) - 1, Number(match[2])),
  );
  return new Intl.DateTimeFormat("ca-ES", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

export function integer(value?: number): string {
  if (value === undefined || Number.isNaN(value)) return "—";
  return String(Math.round(value));
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

const POSITION_SHORT: Record<string, string> = {
  PG: "B",
  SG: "E",
  SF: "A",
  PF: "AP",
  C: "P",
  G: "E",
  F: "A",
};

export function positionLabel(abbreviation?: string): string {
  if (!abbreviation) return "—";
  return POSITION_LABELS[abbreviation] ?? abbreviation;
}

export function positionShort(abbreviation?: string): string {
  if (!abbreviation) return "—";
  return POSITION_SHORT[abbreviation] ?? abbreviation;
}

export function statusLabel(raw?: string): string {
  if (!raw) return "—";
  const value = raw.trim().toLowerCase();
  if (value === "active") return "Actiu";
  if (value === "inactive") return "Inactiu";
  return raw;
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

export function errorMessage(error: unknown): string {
  if (error instanceof DOMException && error.name === "AbortError") {
    return "Operació cancel·lada";
  }
  if (error instanceof Error) return error.message;
  return String(error);
}
