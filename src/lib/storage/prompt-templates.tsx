export const STRICT_REVIEW_TEMPLATE_VARIABLES = [
  {
    key: 'source',
    label: 'Source branch',
    description: 'Source branch of the current MR.',
  },
  {
    key: 'target',
    label: 'Target branch',
    description: 'Target branch of the current MR.',
  },
  {
    key: 'url',
    label: 'MR URL',
    description: 'Full URL of the current MR page.',
  },
] as const;

export type StrictReviewTemplateVariableKey =
  (typeof STRICT_REVIEW_TEMPLATE_VARIABLES)[number]['key'];

export const DEFAULT_STRICT_REVIEW_TEMPLATE = `$strict-review Run strict-review on {url}.

Source branch: {source}
Target branch: {target}
Scope: full diff from {source} into {target}
Read existing MR discussions and dedupe.
Do not fetch Jira.
Output Turkish findings with severity, confidence, file:line, impact, and next step.`;

const strictReviewTemplate = storage.defineItem<string>(
  'local:strictReviewTemplate',
  { fallback: DEFAULT_STRICT_REVIEW_TEMPLATE },
);

export const getStrictReviewTemplate = async () =>
  strictReviewTemplate.getValue();

export const setStrictReviewTemplate = async (value: string) =>
  strictReviewTemplate.setValue(value);

export const renderTemplate = (
  template: string,
  vars: Record<string, string>,
) =>
  template.replace(/\{(\w+)\}/g, (match, key) =>
    Object.prototype.hasOwnProperty.call(vars, key) ? vars[key] : match,
  );

export const useStrictReviewTemplate = () => {
  const [template, setTemplate] = useState<string>(
    DEFAULT_STRICT_REVIEW_TEMPLATE,
  );

  useEffect(() => {
    strictReviewTemplate.getValue().then(setTemplate);
    const unwatch = strictReviewTemplate.watch((next) => setTemplate(next));
    return () => unwatch();
  }, []);

  return { template, setTemplate: setStrictReviewTemplate };
};
