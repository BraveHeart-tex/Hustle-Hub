export interface GitlabReviewer {
  gitlabId: string;
  name: string;
}

export interface ReviewerPreset {
  id: string;
  label: string;
  users: string[];
}
