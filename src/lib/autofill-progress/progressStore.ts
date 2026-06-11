export type StepStatus =
  | 'pending'
  | 'running'
  | 'success'
  | 'skipped'
  | 'failed';

export interface ProgressStep {
  id: string;
  label: string;
  status: StepStatus;
}

interface ProgressState {
  visible: boolean;
  steps: ProgressStep[];
}

let state: ProgressState = { visible: false, steps: [] };
const listeners = new Set<() => void>();

const setState = (next: ProgressState) => {
  // Replace the object on every mutation so getSnapshot returns a stable
  // reference until something actually changes (required by useSyncExternalStore).
  state = next;
  listeners.forEach((listener) => listener());
};

export const progressStore = {
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },

  getSnapshot: () => state,

  registerSteps(steps: { id: string; label: string }[]) {
    setState({
      visible: true,
      steps: steps.map((step) => ({ ...step, status: 'pending' })),
    });
  },

  setStatus(id: string, status: StepStatus) {
    setState({
      ...state,
      steps: state.steps.map((step) =>
        step.id === id ? { ...step, status } : step,
      ),
    });
  },

  dismiss() {
    setState({ ...state, visible: false });
  },
};

// Wraps an existing step function. Maps its result to a status and returns the
// original value so callers can still use it for control flow.
//   void / true -> success
//   false       -> skipped (the step is valid but had nothing to do)
//   throw       -> failed  (logged, not rethrown, so the rest of the flow runs)
export const runStep = async <T>(
  id: string,
  fn: () => Promise<T>,
): Promise<T | undefined> => {
  progressStore.setStatus(id, 'running');

  try {
    const result = await fn();
    progressStore.setStatus(id, result === false ? 'skipped' : 'success');
    return result;
  } catch (error) {
    console.error(`autofill step failed: ${id}`, error);
    progressStore.setStatus(id, 'failed');
    return undefined;
  }
};
