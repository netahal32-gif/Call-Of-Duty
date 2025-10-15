import type { FastifyInstance } from "fastify";
import type { Collection } from "mongodb"; 
import {
	postSoldiersSchema, 
	type SoldierInput,
	type rankNames,
} from "../schema/soldierSchema.js";

interface Soldier {
	_id: string;
	name: string;
	rank: {
		name: (typeof rankNames)[number];
		value: number;
	};
	limitations: string[];
}

export const parseSoldierData = (data: SoldierInput) => {};
