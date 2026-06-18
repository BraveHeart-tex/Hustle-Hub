import '@/assets/tailwind.css';

import {
  CheckCircle2,
  Circle,
  Loader2,
  MinusCircle,
  X,
  XCircle,
} from 'lucide-react';
import { StrictMode, useSyncExternalStore } from 'react';

import { Button } from '@/components/ui/button';
import {
  type ProgressStep,
  progressStore,
  type StepStatus,
} from '@/lib/autofill-progress/progressStore';

const StepStatusIcon = ({ status }: { status: StepStatus }) => {
  switch (status) {
    case 'running':
      return (
        <Loader2 className="h-4 w-4 shrink-0 animate-spin text-blue-600" />
      );
    case 'success':
      return <CheckCircle2 className="h-4 w-4 shrink-0 text-green-600" />;
    case 'skipped':
      return <MinusCircle className="h-4 w-4 shrink-0 text-amber-500" />;
    case 'failed':
      return <XCircle className="h-4 w-4 shrink-0 text-red-600" />;
    case 'pending':
    default:
      return <Circle className="h-4 w-4 shrink-0 text-muted-foreground" />;
  }
};

const StepRow = ({ step }: { step: ProgressStep }) => {
  const isMuted = step.status === 'pending';

  return (
    <div className="flex items-center gap-2">
      <StepStatusIcon status={step.status} />
      <span
        className={`text-xs ${isMuted ? 'text-muted-foreground' : 'text-foreground'}`}
      >
        {step.label}
      </span>
    </div>
  );
};

export const AutofillProgressApp = () => {
  const { visible, steps } = useSyncExternalStore(
    progressStore.subscribe,
    progressStore.getSnapshot,
  );

  if (!visible || steps.length === 0) return null;

  const isRunning = steps.some(
    (step) => step.status === 'pending' || step.status === 'running',
  );
  const title = isRunning ? 'Autofilling MR…' : 'Autofill complete';

  return (
    <StrictMode>
      <div className="fixed bottom-24 right-6 z-999999">
        <div className="w-64 rounded-xl border bg-card text-card-foreground shadow-sm">
          <div className="flex items-center justify-between gap-2 border-b px-3 py-2">
            <span className="text-xs font-semibold">{title}</span>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 shrink-0"
              onClick={() => progressStore.dismiss()}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
          <div className="grid gap-2 px-3 py-2.5">
            {steps.map((step) => (
              <StepRow key={step.id} step={step} />
            ))}
          </div>
        </div>
      </div>
    </StrictMode>
  );
};
