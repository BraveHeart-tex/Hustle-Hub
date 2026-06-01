import { Loader2, RotateCcw } from 'lucide-react';
import {
  type FormEvent,
  Fragment,
  type ReactNode,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DEFAULT_STRICT_REVIEW_TEMPLATE,
  setStrictReviewTemplate,
  STRICT_REVIEW_TEMPLATE_VARIABLES,
  type StrictReviewTemplateVariableKey,
  useStrictReviewTemplate,
} from '@/lib/storage/prompt-templates';

import { Button } from '../ui/button';
import { Label } from '../ui/label';
import {
  TemplateVariableEditor,
  type TemplateVariableEditorHandle,
} from './TemplateVariableEditor';

const PREVIEW_VARS: Record<StrictReviewTemplateVariableKey, string> = {
  source: 'feature/example',
  target: 'main',
  url: 'https://gitlab.example.com/group/project/-/merge_requests/123',
};

const KNOWN_VARIABLE_KEYS = new Set<string>(
  STRICT_REVIEW_TEMPLATE_VARIABLES.map((v) => v.key),
);

const renderPreviewTokens = (
  template: string,
  substitutions: Record<string, string>,
): ReactNode[] => {
  const nodes: ReactNode[] = [];
  const regex = /\{(\w+)\}/g;
  let last = 0;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(template)) !== null) {
    if (match.index > last) {
      nodes.push(
        <Fragment key={`t-${last}`}>
          {template.slice(last, match.index)}
        </Fragment>,
      );
    }
    const key = match[1];
    const known = KNOWN_VARIABLE_KEYS.has(key);
    const display = known ? substitutions[key] : match[0];
    nodes.push(
      <span
        key={`v-${match.index}`}
        className={
          known
            ? 'rounded-md bg-info text-info-foreground px-1.5 py-0.5 font-semibold'
            : 'rounded-md bg-destructive/20 text-destructive px-1.5 py-0.5 font-semibold'
        }
      >
        {display}
      </span>,
    );
    last = match.index + match[0].length;
  }
  if (last < template.length) {
    nodes.push(<Fragment key={`t-${last}`}>{template.slice(last)}</Fragment>);
  }
  return nodes;
};

export const StrictReviewTemplateDialog = ({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (nextOpen: boolean) => void;
}) => {
  const { template } = useStrictReviewTemplate();
  const [draft, setDraft] = useState(template);
  const [isSaving, setIsSaving] = useState(false);
  const editorHandleRef = useRef<TemplateVariableEditorHandle>(null);

  useEffect(() => {
    if (open) setDraft(template);
  }, [open, template]);

  const previewTokens = useMemo(
    () => renderPreviewTokens(draft, PREVIEW_VARS),
    [draft],
  );
  const isDirty = draft !== template;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSaving(true);
    try {
      await setStrictReviewTemplate(draft);
      onOpenChange(false);
    } catch {
      window.alert('Failed to save template');
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setDraft(DEFAULT_STRICT_REVIEW_TEMPLATE);
    editorHandleRef.current?.setTemplateString(DEFAULT_STRICT_REVIEW_TEMPLATE);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl sm:max-w-3xl max-h-[85vh] flex flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle>Strict Review Template</DialogTitle>
          <DialogDescription>
            Customize the prompt copied from the strict-review shortcut. Type{' '}
            <code className="rounded bg-muted px-1 py-0.5 text-xs">/</code> to
            insert a variable, or click a chip below.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={handleSubmit}
          className="flex min-h-0 flex-1 flex-col gap-4"
        >
          <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto pr-1">
            <div className="space-y-2">
              <Label>Insert variable</Label>
              <div className="flex flex-wrap gap-1.5">
                {STRICT_REVIEW_TEMPLATE_VARIABLES.map((variable) => (
                  <button
                    key={variable.key}
                    type="button"
                    onClick={() =>
                      editorHandleRef.current?.insertVariable(variable.key)
                    }
                    className="rounded-md border border-border bg-secondary px-2 py-1 text-xs font-mono text-secondary-foreground hover:bg-secondary/80 hover:border-primary/40 transition-colors"
                    title={variable.description}
                  >
                    {`{${variable.key}}`}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2 px-1">
              <Label>Template</Label>
              <TemplateVariableEditor
                value={draft}
                onChange={setDraft}
                variables={STRICT_REVIEW_TEMPLATE_VARIABLES}
                handleRef={editorHandleRef}
              />
            </div>

            <div className="space-y-2 px-1">
              <Label>Preview</Label>
              <div className="max-h-48 overflow-auto rounded-md border bg-muted/30 p-3 text-xs whitespace-pre-wrap break-words font-mono leading-snug">
                {previewTokens}
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 border-t pt-4">
            <Button
              type="button"
              variant="ghost"
              onClick={handleReset}
              disabled={isSaving}
            >
              <RotateCcw className="size-3.5" />
              Reset to default
            </Button>
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={isSaving}>
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" disabled={isSaving || !isDirty}>
              {isSaving && <Loader2 className="animate-spin" />}
              {isSaving ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
