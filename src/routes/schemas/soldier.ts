import { z } from "zod";

export const soldierSchema = z.object({
    _id: z.string().regex(/^\d{7}$/, "Must be a 7-digit number string."),
    name: z.string().min(3).max(50),
    rank: {
        name: z.string(),
        value: z.number().min(0).max(6),
    },
    //age: z.number().int().positive("Age must be positive"),
    limitations: z.array(z.string()).transform((arr) => arr.map((limit) => limit.toLowerCase())).default([]),
});

export type Soldier = z.infer<typeof soldierSchema>;
