import type { FastifyInstance } from "fastify";

const healthRoutes = async (server: FastifyInstance) => {
	server.get("/", async (_, res) => {
		return res.status(200).send({ Server_Status: "ok" });
	});

	server.get("/db", async (_, res) => {
		if (server.mongo?.db) {
			return res.status(200).send({ DB_Status: "ok" });
		} else {
			return res.status(503).send({ status: "No mongoDB conection" });
		}
	});
};

export default healthRoutes;
