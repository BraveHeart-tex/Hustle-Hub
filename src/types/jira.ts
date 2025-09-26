import { ApiResponse } from '@/types/api';

export interface JiraIssue {
  expand: string;
  id: string;
  self: string;
  key: string;
  fields: {
    summary: string;
    assignee: {
      self: string;
      accountId: string;
      emailAddress: string;
      avatarUrls: {
        '16x16': string;
        '24x24': string;
        '32x32': string;
        '48x48': string;
      };
      displayName: string;
      active: boolean;
      timeZone: string;
      accountType: string;
    };
    priority: {
      self: string;
      iconUrl: string;
      name: string;
      id: string;
    };
    /** ISO date string */
    updated: string;
    status: {
      self: string;
      description: string;
      iconUrl: string;
      name: string;
      id: string;
      statusCategory: {
        self: string;
        id: number;
        key: string;
        colorName: string;
        name: string;
      };
    };
  };
}

export type JiraApiResponse = ApiResponse<{ issues: JiraIssue[] }>;
