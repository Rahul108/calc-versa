const twoDp: Intl.NumberFormatOptions = { minimumFractionDigits: 2, maximumFractionDigits: 2 };

export function formatNumber(value: unknown, options: Intl.NumberFormatOptions = { maximumFractionDigits: 4 }): string {
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) ? n.toLocaleString('en-US', options) : String(value ?? '–');
}

export function formatMoney(value: unknown, currency: string): string {
  return `${currency} ${formatNumber(value, twoDp)}`;
}

/** Today's date in the user's local time zone as YYYY-MM-DD (toISOString would use UTC). */
export function localToday(now = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

export function humanize(key: string): string {
  const spaced = key.replace(/_/g, ' ').trim();
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}
