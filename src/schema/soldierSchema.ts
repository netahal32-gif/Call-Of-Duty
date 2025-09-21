import { z } from "zod";

const rankNames = [
	"private",
	"corporal",
	"sergeant",
	"lieutenant",
	"captain",
	"major",
	"colonel",
] as const;

export const soldiersSchema = z.object({
	_id: z.string().length(7),
	name: z.string().max(50).min(3),
	rank: {
		name: z.enum(rankNames),
		rankValue: z.number().min(0).max(6),
	},
	limitations: z.array(
		z.string().refine((string) => string === string.toLowerCase()),
	),
	createdAt: z.date(),
	updatedAt: z.date(),
});
