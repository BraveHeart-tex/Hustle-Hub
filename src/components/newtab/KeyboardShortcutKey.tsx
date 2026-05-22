interface KeyboardShortcutKeyProps {
  children: string;
}

export default function KeyboardShortcutKey({
  children,
}: KeyboardShortcutKeyProps) {
  return (
    <kbd className="inline-flex h-5 min-w-5 items-center justify-center rounded border border-border bg-muted px-1.5 font-mono text-[10px] font-medium leading-none text-muted-foreground shadow-xs">
      {children}
    </kbd>
  );
}
