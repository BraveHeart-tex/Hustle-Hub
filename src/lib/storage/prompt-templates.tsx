import { type StrictReviewTemplate } from '@/types/prompt-templates';

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

const strictReviewTemplates = storage.defineItem<StrictReviewTemplate[]>(
  'local:strictReviewTemplates',
  { fallback: [] },
);

const getTemplates = async (): Promise<StrictReviewTemplate[]> => {
  const existing = await strictReviewTemplates.getValue();
  if (existing.length > 0) return existing;

  const seeded: StrictReviewTemplate[] = [
    {
      id: crypto.randomUUID(),
      name: 'Default',
      urlPattern: '',
      template: DEFAULT_STRICT_REVIEW_TEMPLATE,
      isDefault: true,
    },
  ];
  await strictReviewTemplates.setValue(seeded);
  return seeded;
};

const getProjectPath = (url: string): string => {
  try {
    const { pathname } = new URL(url);
    const markerIndex = pathname.indexOf('/-/');
    const path = markerIndex === -1 ? pathname : pathname.slice(0, markerIndex);
    return path.replace(/^\/+|\/+$/g, '');
  } catch {
    return '';
  }
};

const termToRegex = (term: string): RegExp => {
  const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const withWildcard = escaped.replace(/\\\*/g, '.*');
  return new RegExp(withWildcard, 'i');
};

const matchesUrlPattern = (pattern: string, projectPath: string): boolean => {
  const terms = pattern
    .split(/[\n,]/)
    .map((term) => term.trim())
    .filter((term) => term !== '');
  if (terms.length === 0) return false;

  const positives: string[] = [];
  const negatives: string[] = [];
  for (const term of terms) {
    const negation = /^(!|not\s+)/i.exec(term);
    if (negation) {
      negatives.push(term.slice(negation[0].length).trim());
    } else {
      positives.push(term);
    }
  }

  if (negatives.some((term) => termToRegex(term).test(projectPath))) {
    return false;
  }
  if (positives.length === 0) return true;
  return positives.some((term) => termToRegex(term).test(projectPath));
};

// Picks the template to use for an MR URL: the first template whose urlPattern
// matches the project path, then the designated default, then the first one.
export const pickTemplateForUrl = (
  templates: StrictReviewTemplate[],
  url: string,
): StrictReviewTemplate | undefined => {
  if (templates.length === 0) return undefined;

  const projectPath = getProjectPath(url);
  const matched = templates.find((item) =>
    matchesUrlPattern(item.urlPattern, projectPath),
  );
  if (matched) return matched;

  return templates.find((item) => item.isDefault) ?? templates[0];
};

export const addStrictReviewTemplate = async (
  template: StrictReviewTemplate,
) => {
  const current = await getTemplates();
  await strictReviewTemplates.setValue([...current, template]);
};

export const updateStrictReviewTemplate = async (
  id: string,
  updated: StrictReviewTemplate,
) => {
  const current = await getTemplates();
  await strictReviewTemplates.setValue(
    current.map((item) => (item.id === id ? updated : item)),
  );
};

export const removeStrictReviewTemplate = async (id: string) => {
  const current = await getTemplates();
  const remaining = current.filter((item) => item.id !== id);
  if (remaining.length > 0 && !remaining.some((item) => item.isDefault)) {
    remaining[0] = { ...remaining[0], isDefault: true };
  }
  await strictReviewTemplates.setValue(remaining);
};

export const setDefaultStrictReviewTemplate = async (id: string) => {
  const current = await getTemplates();
  await strictReviewTemplates.setValue(
    current.map((item) => ({ ...item, isDefault: item.id === id })),
  );
};

export const renderTemplate = (
  template: string,
  vars: Record<string, string>,
) =>
  template.replace(/\{(\w+)\}/g, (match, key) =>
    Object.prototype.hasOwnProperty.call(vars, key) ? vars[key] : match,
  );

export const useStrictReviewTemplates = () => {
  const [templates, setTemplates] = useState<StrictReviewTemplate[]>([]);

  useEffect(() => {
    getTemplates().then(setTemplates);
    const unwatch = strictReviewTemplates.watch((next) => {
      if (next.length > 0) setTemplates(next);
    });
    return () => unwatch();
  }, []);

  return { templates };
};
