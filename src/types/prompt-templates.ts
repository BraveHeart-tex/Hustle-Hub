export interface StrictReviewTemplate {
  id: string;
  name: string;
  // Substring matched against the MR's project path (e.g. "group/project").
  // Empty means this template is never auto-selected by URL.
  urlPattern: string;
  template: string;
  // Used when no urlPattern matches the current MR. Exactly one template
  // should have this set to true.
  isDefault: boolean;
}
