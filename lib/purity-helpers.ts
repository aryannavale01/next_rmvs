// Side-effect and dynamic generation helpers isolated to resolve React 19 component purity rules

export function makeId(prefix: string): string {
  return `${prefix}-${Date.now()}`;
}

export function makeCertificateNo(courseId: string): string {
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `CERT-2026-${courseId.toUpperCase().replace('-', '')}-${rand}`;
}

export function getTodayIsoDate(): string {
  return new Date().toISOString().split('T')[0];
}

export function getCurrentIsoString(): string {
  return new Date().toISOString();
}

export function getPastTimestamp(days: number): number {
  return Date.now() - days * 24 * 60 * 60 * 1000;
}

