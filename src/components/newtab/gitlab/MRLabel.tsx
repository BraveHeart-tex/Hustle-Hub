import { useTheme } from '@/components/newtab/ThemeProvider';
import { formatGitLabLabel } from '@/lib/utils/formatters/formatGitLabel';
import { type GitlabMergeRequest } from '@/types/gitlab';

function hexToRgb(hex: string): [number, number, number] {
  const cleaned = hex.replace('#', '');
  const int = parseInt(
    cleaned.length === 3
      ? cleaned
          .split('')
          .map((c) => c + c)
          .join('')
      : cleaned,
    16,
  );
  return [(int >> 16) & 255, (int >> 8) & 255, int & 255];
}

// Perceived brightness (0–255), based on WCAG relative luminance
function brightness(hex: string): number {
  const [r, g, b] = hexToRgb(hex);
  return 0.299 * r + 0.587 * g + 0.114 * b;
}

// Mix a hex color toward white by `amount` (0–1)
function lighten(hex: string, amount: number): string {
  const [r, g, b] = hexToRgb(hex);
  const mix = (c: number) => Math.round(c + (255 - c) * amount);
  return `rgb(${mix(r)}, ${mix(g)}, ${mix(b)})`;
}

function darken(hex: string, amount: number): string {
  const [r, g, b] = hexToRgb(hex);
  const mix = (colorChannel: number) => Math.round(colorChannel * (1 - amount));
  return `rgb(${mix(r)}, ${mix(g)}, ${mix(b)})`;
}

export const MrLabel = ({
  label,
}: {
  label: GitlabMergeRequest['labels'][number];
}) => {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  const isTooDark = brightness(label.color) < 80;

  const textColor = isDark
    ? lighten(label.color, isTooDark ? 0.65 : 0.45)
    : darken(label.color, 0.35);

  const bgOpacity = isDark ? '33' : '26'; // 20% dark / 15% light
  const borderOpacity = isDark ? '55' : '40'; // 33% dark / 25% light

  return (
    <span
      className="text-[10px] font-medium rounded px-1.5 py-px leading-none"
      style={{
        backgroundColor: `${label.color}${bgOpacity}`,
        color: textColor,
        border: `1px solid ${label.color}${borderOpacity}`,
      }}
    >
      {formatGitLabLabel(label.title)}
    </span>
  );
};
