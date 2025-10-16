import { z } from "zod";

const ranks = [
    "private",
    "corporal",
    "sergeant",
    "lieutenant",
    "captain",
    "major",
    "colonel",
] as const;

const timestampsSchema = z.object({
    createdAt: z.date(),
    updatedAt: z.date(),
});

export const soldierSchema = z.object({
    _id: z.string().regex(/^\d{7}$/, "Must be a 7-digit number string."),
    name: z.string().min(3).max(50),
    rank: z.object({
        name: z.enum(ranks).optional(),
        value: z.number().refine(v => v >= 0 && v <= 6, "Value must be between 0 and 6").optional(),
    })
        .superRefine((rank, ctx) => {
            if (rank.name === undefined && rank.value === undefined) {
                ctx.addIssue({
                    code: "custom",
                    message: "Either rank.name or rank.value is required",
                });
            }

            if (rank.name && rank.value === undefined) {
                rank.value = ranks.indexOf(rank.name);
            } else if (rank.value && rank.name === undefined) {
                rank.name = ranks[rank.value];
            }

            if (
                rank.name &&
                rank.value !== undefined &&
                ranks[rank.value] !== rank.name
            ) {
                ctx.addIssue({
                    code: "custom",
                    message: `rank.name and rank.value do not match (${rank.name} ≠ ${rank.value})`,
                });
            }
        }),
    limitations: z.array(z.string()).transform((arr) => arr.map((limit) => limit.toLowerCase())).default([]),
});

export const soldierOutputSchema = soldierSchema.extend(timestampsSchema.shape);

export type SoldierOutput = z.infer<typeof soldierOutputSchema>;

export type Soldier = z.infer<typeof soldierSchema>;
