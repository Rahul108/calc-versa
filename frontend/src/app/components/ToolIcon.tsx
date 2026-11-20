// Deterministic colourful monogram per tool, so tools are easy to tell apart at a glance.
const PALETTE = [
  { bg: '#fff0ea', fg: '#d9480f' },
  { bg: '#ffe9f1', fg: '#c2185b' },
  { bg: '#e9f8ef', fg: '#15803d' },
  { bg: '#fff6dc', fg: '#b45309' },
  { bg: '#e8f6f6', fg: '#0f766e' },
  { bg: '#f3edff', fg: '#7c3aed' },
  { bg: '#ffeceb', fg: '#dc2626' },
  { bg: '#eef1ea', fg: '#4d7c0f' },
];

function hash(text: string): number {
  let h = 0;
  for (let i = 0; i < text.length; i++) h = (h * 31 + text.charCodeAt(i)) >>> 0;
  return h;
}

function monogram(name: string): string {
  const words = name.replace(/[^\p{L}\p{N} ]/gu, ' ').trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return '?';
  const pick = words.length > 1 && /^\d/.test(words[0]) ? words.slice(1) : words;
  return (pick[0][0] + (pick[1]?.[0] ?? '')).toUpperCase();
}

export function ToolIcon({ name, seed, large = false }: { name: string; seed?: string; large?: boolean }) {
  const color = PALETTE[hash(seed ?? name) % PALETTE.length];
  return (
    <span
      className={large ? 'tool-icon tool-icon-lg' : 'tool-icon'}
      style={{ background: color.bg, color: color.fg }}
      aria-hidden="true"
    >
      {monogram(name)}
    </span>
  );
}
