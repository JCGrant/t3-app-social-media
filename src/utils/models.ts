export const userSlug = (user: { username: string | null; id: string }) =>
  user.username ?? user.id;
