interface KeyboardShortcutProps {
  keyLabel: string;
}

const KeyboardShortcut = ({ keyLabel }: KeyboardShortcutProps) => {
  console.log(keyLabel);

  return (
    <kbd className="bg-muted text-muted-foreground pointer-events-none inline-flex h-5 items-center gap-1 rounded border px-1.5 font-mono text-[10px] font-medium opacity-100 select-none">
      <span className="text-xs">{keyLabel}</span>
    </kbd>
  );
};

export default KeyboardShortcut;
