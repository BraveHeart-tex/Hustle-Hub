import { GitBranch, GitMerge, MessageSquare, ThumbsUp } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const mockMergeRequests = [
  {
    id: 42,
    title: 'feat: Add dark mode support',
    author: 'john.doe',
    branch: 'feature/dark-mode',
    target: 'main',
    status: 'open',
    approvals: 2,
    requiredApprovals: 2,
    comments: 5,
    updatedAt: '2 hours ago',
  },
  {
    id: 41,
    title: 'fix: Resolve memory leak in data processing',
    author: 'sarah.chen',
    branch: 'bugfix/memory-leak',
    target: 'develop',
    status: 'needs-review',
    approvals: 0,
    requiredApprovals: 1,
    comments: 2,
    updatedAt: '4 hours ago',
  },
  {
    id: 40,
    title: 'docs: Update API documentation',
    author: 'mike.wilson',
    branch: 'docs/api-update',
    target: 'main',
    status: 'approved',
    approvals: 3,
    requiredApprovals: 2,
    comments: 8,
    updatedAt: '1 day ago',
  },
  {
    id: 39,
    title: 'refactor: Optimize database queries',
    author: 'you',
    branch: 'refactor/db-optimization',
    target: 'develop',
    status: 'merged',
    approvals: 2,
    requiredApprovals: 2,
    comments: 12,
    updatedAt: '2 days ago',
  },
];

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'open':
      return (
        <Badge variant="secondary" className="text-xs">
          Open
        </Badge>
      );
    case 'needs-review':
      return (
        <Badge variant="destructive" className="text-xs">
          Needs Review
        </Badge>
      );
    case 'approved':
      return (
        <Badge className="text-xs bg-green-500 hover:bg-green-600">
          Approved
        </Badge>
      );
    case 'merged':
      return (
        <Badge variant="outline" className="text-xs">
          Merged
        </Badge>
      );
    default:
      return (
        <Badge variant="outline" className="text-xs">
          {status}
        </Badge>
      );
  }
};

export default function GitlabSection() {
  return (
    <Card className="h-fit">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <GitMerge className="h-5 w-5 text-primary" />
          GitLab MRs
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {mockMergeRequests.map((mr) => (
          <div
            key={mr.id}
            className="p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors cursor-pointer"
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-muted-foreground">
                  !{mr.id}
                </span>
                {getStatusBadge(mr.status)}
              </div>
              <span className="text-xs text-muted-foreground">
                {mr.updatedAt}
              </span>
            </div>

            <h3 className="font-medium text-sm text-foreground mb-2 text-balance">
              {mr.title}
            </h3>

            <div className="flex items-center gap-2 mb-2 text-xs text-muted-foreground">
              <GitBranch className="h-3 w-3" />
              <span>{mr.branch}</span>
              <span>→</span>
              <span>{mr.target}</span>
            </div>

            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>by @{mr.author}</span>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1">
                  <ThumbsUp className="h-3 w-3" />
                  <span>
                    {mr.approvals}/{mr.requiredApprovals}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <MessageSquare className="h-3 w-3" />
                  <span>{mr.comments}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
