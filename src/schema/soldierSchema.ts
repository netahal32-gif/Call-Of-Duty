import { z } from "zod";
import { rankMap, valueToRank } from "../utils/rankMap.js";

export const rankNames = [
  "private",
  "corporal",
  "sergeant",
  "lieutenant",
  "captain",
  "major",
  "colonel",
] as const;

export const postSoldiersSchema = z
  .object({
    _id: z
      .string()
      .regex(/^\d{7}$/, "_id must be a 7-digit number string"),
    name: z.string().min(3).max(50),
    rank: z
      .object({
        name: z.enum(rankNames).optional(),
        value: z.number().min(0).max(6).optional(),
      })
      .refine(
        (rank) => rank.name !== undefined || rank.value !== undefined,
        "Either rank.name or rank.value must be provided"
      ),
    limitations: z.array(
      z
        .string()
        .refine((str) => str === str.toLowerCase(), "must be lowercase")
    ),
  })
  .transform((data) => {
    if (data.rank.name && data.rank.value === undefined) {
      data.rank.value = rankMap[data.rank.name];
    } else if (data.rank.value !== undefined && !data.rank.name) {
      data.rank.name = valueToRank[data.rank.value];
    }
    return data;
  });

export type SoldierInput = z.infer<typeof postSoldiersSchema>;

// createdAt: z.date(),
// updatedAt: z.date(),
