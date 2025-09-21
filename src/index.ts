import fastifyMongo from "@fastify/mongodb";
import * as dotenv from "dotenv";

import { buildServer } from "./routes/server.js";

dotenv.config();

const PORT = Number(process.env.PORT);
const MONGOURL = String(process.env.MONGOURL);

const start = async () => {
	const server = await buildServer();
	try {
		await server.register(fastifyMongo, {
			url: MONGOURL,
			forceClose: true,
		});

		await server.listen({ port: PORT });
	} catch (err) {
		server.log.error(err);
		process.exit(1);
	}
};

start();
