import { useEffect, useRef } from 'react';

interface ShortcutOption<TValue extends string> {
  key: string;
  value: TValue;
}

interface UseTwoKeyFilterShortcutsParams<TValue extends string> {
  disabled?: boolean;
  options: ShortcutOption<TValue>[];
  prefixKey: string;
  onCancel: () => void;
  onPrefix: () => void;
  onSelect: (value: TValue) => void;
}

const SHORTCUT_TIMEOUT_MS = 1400;

const isEditableTarget = (target: EventTarget | null): boolean => {
  if (!(target instanceof HTMLElement)) return false;

  if (target.isContentEditable) return true;

  const editableElement = target.closest(
    'input, textarea, select, [contenteditable="true"], [role="textbox"]',
  );

  return Boolean(editableElement);
};

export const useTwoKeyFilterShortcuts = <TValue extends string>({
  disabled = false,
  options,
  prefixKey,
  onCancel,
  onPrefix,
  onSelect,
}: UseTwoKeyFilterShortcutsParams<TValue>) => {
  const pendingPrefixRef = useRef(false);
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    const clearPendingShortcut = () => {
      pendingPrefixRef.current = false;

      if (timeoutRef.current === null) return;

      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    };

    const startPendingShortcut = () => {
      clearPendingShortcut();
      pendingPrefixRef.current = true;
      onPrefix();

      timeoutRef.current = window.setTimeout(() => {
        clearPendingShortcut();
        onCancel();
      }, SHORTCUT_TIMEOUT_MS);
    };

    const cancelPendingShortcut = () => {
      if (!pendingPrefixRef.current) return;

      clearPendingShortcut();
      onCancel();
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (disabled) return;
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (isEditableTarget(event.target)) return;

      const key = event.key.toLowerCase();

      if (key === 'escape') {
        cancelPendingShortcut();
        return;
      }

      if (!pendingPrefixRef.current) {
        if (key !== prefixKey) return;

        event.preventDefault();
        event.stopPropagation();
        startPendingShortcut();
        return;
      }

      event.preventDefault();
      event.stopPropagation();

      const selectedOption = options.find((option) => option.key === key);

      clearPendingShortcut();

      if (!selectedOption) {
        onCancel();
        return;
      }

      onSelect(selectedOption.value);
    };

    document.addEventListener('keydown', handleKeyDown, { capture: true });

    return () => {
      document.removeEventListener('keydown', handleKeyDown, { capture: true });
      clearPendingShortcut();
    };
  }, [disabled, onCancel, onPrefix, onSelect, options, prefixKey]);
};
