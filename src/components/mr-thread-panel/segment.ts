// Shared visual contract for one segment of the mounted command bar. Segments
// are flat and borderless with one shared height so they merge into a single
// control group (dividers + one surface + one shadow live on the parent bar in
// MrThreadApp) instead of reading as separate floating pills.
//
// Pair with `variant="ghost"` and `size="sm"` on the Button: ghost gives a
// hover fill with no border/shadow of its own, and `sm` supplies the uniform
// horizontal padding every icon segment shares.
//
// The ring is inset because the parent bar clips its corners with
// `overflow-hidden`; an outset focus ring would be clipped and effectively
// invisible.
export const SEGMENT_CLASS =
  'h-11 rounded-none gap-1.5 font-normal shadow-none focus-visible:ring-inset';
