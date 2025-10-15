import type { FastifyInstance } from "fastify";
import type { Soldier, SoldierOutput } from "./schemas/soldier.js";
import { postSoldier } from "./helpers/soldierHelpers.js";


const soldierRoutes = async (server: FastifyInstance) => {
    server.post<{ Body: Soldier; res: SoldierOutput }>("/", async (req, res) => {
        try {
            const soldier = await postSoldier(server, req.body);
            res.status(201).send({ "Soldier added successfully": soldier });
        } catch (err: any) {
            server.log.error(err);
            if (err.statusCode === 400) {
                return res.status(400).send({
                    error: err.message,
                    details: err.errors,
                });
            }
            res.status(500).send({
                "Error Adding Soldier":
                    err.message || err,
            });
        }
    });
};

export default soldierRoutes;
