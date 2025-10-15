import type { FastifyInstance } from "fastify";
import type { Collection } from "mongodb";//
import {
	postSoldiersSchema,//
	type SoldierInput,
	type rankNames,
} from "../schema/soldierSchema.js";
import { parseSoldierData } from "../helpers/soldiersHelpers.js";

interface Soldier {
	_id: string;
	name: string;
	rank: {
		name: (typeof rankNames)[number];
		value: number;
	};
	limitations: string[];
}

const soldiersRoutes = async (server: FastifyInstance) => {
	server.post<{ Body: SoldierInput }>("/", async (req, res) => {
		try {
            const soldier2 = parseSoldierData(req.body);//return to this and seperate into helper 

			const parseResult = postSoldiersSchema.safeParse(req.body);

			if (!parseResult.success) {
				return res.status(400).send({ error: parseResult.error.issues });
			}

			const soldier = parseResult.data as Soldier;

			const db = server.mongo.db;
			if (!db) return res.status(500).send({ error: "DB not connected" });

			const collection: Collection<Soldier> = db.collection("Soldiers");

			await collection.insertOne(soldier);
			return res.status(201).send({ soldier });
		} catch (err) {
			server.log.error(err);
			return res.status(500).send({ error: "Internal server error" });
		}
	});
};

export default soldiersRoutes;
