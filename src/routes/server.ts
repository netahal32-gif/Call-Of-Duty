import Fastify from "fastify";
import healthRoutes from "./health.js";

export const buildServer = async () => {
	const server = Fastify({
		logger: {
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

	await server.register(healthRoutes, { prefix: "/health" });
    
	return server;
};
