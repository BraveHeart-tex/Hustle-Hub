import { TagIcon } from 'lucide-react';
import { useEffect, useState } from 'react';

import {
  fetchProjectLabels,
  type GitlabLabel,
} from '@/lib/utils/gitlab/fetchProjectLabels';

import { Button } from '../ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';

const getSelectedLabelNames = (): string[] =>
  Array.from(
    document.querySelectorAll<HTMLElement>(
      '[data-testid="selected-label-content"]',
    ),
  )
    .map((el) => el.dataset.qaLabelName ?? '')
    .filter(Boolean);

const injectLabels = (labels: GitlabLabel[]) => {
  const dropdownToggle = document.querySelector<HTMLElement>(
    '[data-testid="issuable-label-dropdown"]',
  );
  const dropdown = dropdownToggle?.closest('.dropdown');
  if (!dropdown) return;

  // Remove existing label inputs inserted before the dropdown
  dropdown.parentElement
    ?.querySelectorAll<HTMLInputElement>(
      'input[name="merge_request[label_ids][]"]',
    )
    .forEach((el) => el.remove());

  // Clear active states
  dropdown
    .querySelectorAll<HTMLElement>('.dropdown-content a.is-active')
    .forEach((el) => el.classList.remove('is-active'));

  labels.forEach((label) => {
    // Mirror exactly what addInput does: insert BEFORE the dropdown element
    const input = document.createElement('input');
    input.type = 'hidden';
    input.name = 'merge_request[label_ids][]';
    input.value = String(label.id);
    input.dataset.id = String(label.id);
    input.dataset.title = label.name;
    input.dataset.color = label.color;

    dropdown.before(input);

    // Mark list item as active
    dropdown
      .querySelectorAll<HTMLElement>('.dropdown-content li a')
      .forEach((anchor) => {
        if (anchor.dataset.labelId === String(label.id)) {
          anchor.classList.add('is-active');
        }
      });
  });

  // Trigger change on the dropdown element itself (mirrors: this.dropdown.before($input).trigger('change'))
  dropdown.dispatchEvent(new Event('change', { bubbles: true }));

  // Update toggle label
  const labelEl = dropdownToggle?.querySelector('.dropdown-toggle-text');
  if (labelEl) {
    labelEl.textContent =
      labels.length > 0
        ? labels.map((l) => l.name).join(', ')
        : 'Select labels';
  }
};

export const LabelSelectorPopover = ({
  container,
}: {
  container: HTMLElement;
}) => {
  const [allLabels, setAllLabels] = useState<GitlabLabel[]>([]);
  const [selectedLabels, setSelectedLabels] = useState<GitlabLabel[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    fetchProjectLabels().then(setAllLabels).catch(console.error);
  }, []);

  // Sync selected labels from DOM → state whenever allLabels loads or DOM changes
  useEffect(() => {
    if (allLabels.length === 0) return;

    const sync = () => {
      const names = new Set(getSelectedLabelNames());
      setSelectedLabels(allLabels.filter((l) => names.has(l.name)));
    };

    sync();

    const observer = new MutationObserver(sync);
    observer.observe(document.querySelector('.block.labels') || document.body, {
      childList: true,
      subtree: true,
    });
    return () => observer.disconnect();
  }, [allLabels]);

  const selectedIds = new Set(selectedLabels.map((l) => l.id));
  const availableLabels = allLabels.filter((l) => !selectedIds.has(l.id));

  const handleToggleLabel = (label: GitlabLabel) => {
    const isSelected = selectedIds.has(label.id);
    const next = isSelected
      ? selectedLabels.filter((l) => l.id !== label.id)
      : [...selectedLabels, label];
    setSelectedLabels(next);
    injectLabels(next);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="rounded-full shadow-sm gap-1.5 h-auto py-1.5"
        >
          <TagIcon className="h-3.5 w-3.5 shrink-0" />
          <div className="flex flex-col items-start leading-tight">
            <span className="text-xs">Labels</span>
            <span className="text-[10px] text-muted-foreground font-medium">
              {selectedLabels.length > 0
                ? `${selectedLabels.length} selected`
                : 'None'}
            </span>
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent
        container={container}
        side="top"
        align="end"
        className="w-64 p-2 space-y-4"
      >
        {/* Available Labels */}
        <div className="grid gap-1.5">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Available
          </span>
          {availableLabels.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              All labels selected.
            </p>
          ) : (
            availableLabels.map((label) => (
              <div
                key={label.id}
                onClick={() => handleToggleLabel(label)}
                className="flex items-center gap-2 group cursor-pointer rounded px-1 py-0.5 hover:bg-muted transition-colors"
              >
                <span
                  className="h-3 w-3 rounded-full shrink-0 border"
                  style={{ backgroundColor: label.color }}
                />
                <span className="text-xs flex-1 truncate">{label.name}</span>
                <span className="text-[10px] text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                  + add
                </span>
              </div>
            ))
          )}
        </div>

        {/* Selected Labels */}
        <div className="grid gap-1.5">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Selected
          </span>
          {selectedLabels.length === 0 ? (
            <p className="text-xs text-muted-foreground">None selected.</p>
          ) : (
            selectedLabels.map((label) => (
              <div
                key={label.id}
                onClick={() => handleToggleLabel(label)}
                className="flex items-center gap-2 group cursor-pointer rounded px-1 py-0.5 hover:bg-destructive/10 transition-colors"
              >
                <span
                  className="h-3 w-3 rounded-full shrink-0 border"
                  style={{ backgroundColor: label.color }}
                />
                <span className="text-xs flex-1 truncate">{label.name}</span>
                <span className="text-[10px] text-destructive/60 opacity-0 group-hover:opacity-100 transition-opacity">
                  − remove
                </span>
              </div>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};
