export const rankMap = {
  private: 0,
  corporal: 1,
  sergeant: 2,
  lieutenant: 3,
  captain: 4,
  major: 5,
  colonel: 6,
} as const;

export const valueToRank = Object.fromEntries(
  Object.entries(rankMap).map(([k, v]) => [v, k])
) as Record<number, keyof typeof rankMap>;
