import Fastify from "fastify";
import * as dotenv from "dotenv";

dotenv.config();

const PORT = Number(process.env.PORT);

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

server.get("/health", async (_, res) => {
	if (server.server.address()) {
		return res.status(200).send("status: ok");
	} else {
		return res.status(503).send("status: server not ok :'(");
	}
});

const start = async () => {
	try {
		await server.listen({ port: PORT });
		server.log.info(`Server listening on ${server.server.address()}`);
	} catch (err) {
		server.log.error(err);
		process.exit(1);
	}
};

start();
