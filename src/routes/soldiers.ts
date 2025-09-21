import type { FastifyInstance } from "fastify";

const soldiersRoutes = async (server: FastifyInstance) => {
	server.post("/", async (req, res) => {
		
	});

	server.get("/db", async (_, res) => {
		if (server.mongo?.db) {
			return res.status(200).send({ DB_Status: "ok" });
		} else {
			return res.status(503).send({ status: "No mongoDB conection" });
		}
	});
};

export default soldiersRoutes;
