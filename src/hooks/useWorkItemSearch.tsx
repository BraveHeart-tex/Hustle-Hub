import { useMemo } from 'react';

import { useGitlabMrs } from '@/hooks/useGitlabMrs';
import { useJiraTickets } from '@/hooks/useJiraTickets';
import {
  GITLAB_FILTERS,
  type GitlabFilter,
  JIRA_FILTERS,
  type JiraFilter,
} from '@/lib/constants';
import { getJiraTaskUrl } from '@/lib/utils/misc/getJiraTaskUrl';
import { type NoteLinkedWorkItem } from '@/types/notes';

const GITLAB_SEARCH_FILTERS: GitlabFilter[] = [
  GITLAB_FILTERS.ASSIGNED,
  GITLAB_FILTERS.REVIEW,
];

const JIRA_SEARCH_FILTERS: JiraFilter[] = [
  JIRA_FILTERS.FOR_YOU,
  JIRA_FILTERS.LITERALLY_WORKING_ON,
  JIRA_FILTERS.FRONTEND_RELEASES,
];

const normalized = (value: string) => value.toLowerCase().trim();

const matchesWorkItem = (item: NoteLinkedWorkItem, query: string) => {
  if (!query) {
    return true;
  }

  return [
    item.id,
    item.key,
    item.title,
    item.status,
    item.projectName,
    item.type,
  ].some((value) => normalized(value ?? '').includes(query));
};

export const useWorkItemSearch = (query = '') => {
  const assignedMrs = useGitlabMrs(GITLAB_SEARCH_FILTERS[0]);
  const reviewMrs = useGitlabMrs(GITLAB_SEARCH_FILTERS[1]);
  const jiraForYou = useJiraTickets(JIRA_SEARCH_FILTERS[0]);
  const jiraWorkingOn = useJiraTickets(JIRA_SEARCH_FILTERS[1]);
  const jiraFrontendReleases = useJiraTickets(JIRA_SEARCH_FILTERS[2]);

  const items = useMemo(() => {
    const gitlabMap = new Map<string, NoteLinkedWorkItem>();
    [assignedMrs.data ?? [], reviewMrs.data ?? []].forEach((mrs) =>
      mrs.forEach((mr) =>
        gitlabMap.set(String(mr.iid), {
          id: String(mr.iid),
          key: `!${mr.iid}`,
          type: 'gitlab',
          title: mr.title,
          url: mr.webUrl,
          projectName: mr.projectName,
          draft: mr.draft,
          approvedBy: mr.approvedBy,
          approvalsRequired: mr.approvalsRequired,
          conflicts: mr.conflicts,
        }),
      ),
    );

    const jiraMap = new Map<string, NoteLinkedWorkItem>();
    [
      jiraForYou.data?.issues ?? [],
      jiraWorkingOn.data?.issues ?? [],
      jiraFrontendReleases.data?.issues ?? [],
    ].forEach((issues) =>
      issues.forEach((issue) =>
        jiraMap.set(issue.key, {
          id: issue.key,
          key: issue.key,
          type: 'jira',
          title: issue.fields.summary,
          url: getJiraTaskUrl(issue.key),
          status: issue.fields.status.name,
        }),
      ),
    );

    return {
      gitlab: Array.from(gitlabMap.values()),
      jira: Array.from(jiraMap.values()),
    };
  }, [
    assignedMrs.data,
    jiraForYou.data,
    jiraFrontendReleases.data,
    jiraWorkingOn.data,
    reviewMrs.data,
  ]);

  const cleanQuery = normalized(query);
  const filteredGitlab = useMemo(
    () => items.gitlab.filter((item) => matchesWorkItem(item, cleanQuery)),
    [cleanQuery, items.gitlab],
  );
  const filteredJira = useMemo(
    () => items.jira.filter((item) => matchesWorkItem(item, cleanQuery)),
    [cleanQuery, items.jira],
  );

  return {
    gitlab: filteredGitlab,
    jira: filteredJira,
    all: [...filteredGitlab, ...filteredJira],
    isLoading:
      assignedMrs.isLoading ||
      reviewMrs.isLoading ||
      jiraForYou.isLoading ||
      jiraWorkingOn.isLoading ||
      jiraFrontendReleases.isLoading,
    isError:
      assignedMrs.isError ||
      reviewMrs.isError ||
      jiraForYou.isError ||
      jiraWorkingOn.isError ||
      jiraFrontendReleases.isError,
  };
};
