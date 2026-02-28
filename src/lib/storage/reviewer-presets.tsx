import { GitlabReviewer, ReviewerPreset } from '@/types/reviewer-presets';

const gitlabReviewers = storage.defineItem<GitlabReviewer[]>(
  'local:gitlabReviewers',
  { fallback: [] },
);

const reviewerPresets = storage.defineItem<ReviewerPreset[]>(
  'local:reviewerPresets',
  {
    fallback: [],
  },
);

export const getGitlabReviewers = async () => {
  return (await gitlabReviewers.getValue()).toSorted((a, b) =>
    a.name.localeCompare(b.name),
  );
};

export const addGitlabReviewer = async (reviewer: GitlabReviewer) => {
  const currentReviewers = await gitlabReviewers.getValue();

  await gitlabReviewers.setValue([...currentReviewers, reviewer]);
};

export const removeGitlabReviewer = async (
  gitlabId: GitlabReviewer['gitlabId'],
) => {
  const currentReviewers = await gitlabReviewers.getValue();

  await gitlabReviewers.setValue(
    currentReviewers.filter((reviewer) => reviewer.gitlabId !== gitlabId),
  );
};

export const updateGitlabReviewer = async (
  gitlabId: string,
  updatedReviewer: GitlabReviewer,
) => {
  const currentReviewers = await gitlabReviewers.getValue();

  await gitlabReviewers.setValue(
    currentReviewers.map((reviewer) =>
      reviewer.gitlabId === gitlabId ? updatedReviewer : reviewer,
    ),
  );
};

export const getReviewerPresets = async () => {
  const [reviewers, presets] = await Promise.all([
    getGitlabReviewers(),
    reviewerPresets.getValue(),
  ]);

  return presets.map((preset) => ({
    ...preset,
    reviewers: reviewers.filter((reviewer) =>
      preset.users.includes(reviewer.gitlabId),
    ),
  }));
};

export const addReviewerPreset = async (preset: ReviewerPreset) => {
  const currentPresets = await reviewerPresets.getValue();

  await reviewerPresets.setValue([...currentPresets, preset]);
};

export const removeReviewerPreset = async (preset: ReviewerPreset) => {
  const currentPresets = await reviewerPresets.getValue();

  await reviewerPresets.setValue(
    currentPresets.filter((p) => p.id !== preset.id),
  );
};

export const useReviewers = () => {
  const [reviewers, setReviewers] = useState<GitlabReviewer[]>([]);

  useEffect(() => {
    const fetchReviewers = async () => {
      const gitlabReviewers = await getGitlabReviewers();
      setReviewers(gitlabReviewers);
    };

    fetchReviewers();

    const unwatch = gitlabReviewers.watch((newReviewers) => {
      setReviewers(
        newReviewers.toSorted((a, b) => a.name.localeCompare(b.name)),
      );
    });

    return () => {
      unwatch();
    };
  }, []);

  return { reviewers };
};
