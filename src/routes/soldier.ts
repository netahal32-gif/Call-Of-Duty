import type { FastifyInstance } from "fastify";
import { soldierSchema } from "./schemas/soldier.js";
import type { Soldier } from "./schemas/soldier.js";

interface SoldierOutput extends Soldier {
    createdAt: Date;
    updatedAt: Date;
}

const soldierRoutes = async (server: FastifyInstance) => {
    server.post<{ Body: Soldier; Replay: SoldierOutput }>("/", async (req, res) => {

        const db = server.mongo.db;
        if (!db) throw new Error("MongoDB not connected");

        const existing = await db.collection('soldiers').findOne({});

        if (!existing) {
            await db.createCollection("soldiers");
            server.log.info('Created "soldiers" collection');
        }

        const parseResult = soldierSchema.safeParse(req.body);

        if (!parseResult.success) {
            return res.status(400).send({
                error: "Invalid request body",
                details: parseResult.error.flatten().fieldErrors,
            });
        }

        const collection = db.collection<Soldier>("soldiers");
        const soldier = parseResult.data;

        try {
            await collection.insertOne(soldier);
            res.status(201).send({ "Soldier added successfully": soldier });
        } catch (err) {
            server.log.error(err);
            res.status(500).send({ "Error Adding Soldier": err })
        }
    })
};

export default soldierRoutes;
