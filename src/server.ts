import healthRoutes from "./routes/health.js";
import fastifyMongo from "@fastify/mongodb";
import * as dotenv from "dotenv";
import Fastify from "fastify";

dotenv.config();

const MONGOURL = String(process.env.MONGOURL);

const buildServer = async () => {
	const server = Fastify({
		logger:
			process.env.NODE_ENV === "test"
				? false
				: {
						level: "info",
						transport: {
							target: "pino-pretty",
							options: {
								colorize: true,
								translateTime: "SYS:HH:MM:ss Z",
								ignore: "pid,hostname",
							},
						},
					},
	});
	await server.register(fastifyMongo, { url: MONGOURL, forceClose: true });

	await server.register(healthRoutes, { prefix: "/health" });

	return server;
};

export default buildServer;///update index
