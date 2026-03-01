export const getGitlabUserAvatar = (gitlabUserId: string): string => {
  return `https://gitlab.com/uploads/-/system/user/avatar/${gitlabUserId}/avatar.png`;
};
