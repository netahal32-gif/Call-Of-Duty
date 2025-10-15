import buildServer from "./server.js";

const PORT = Number(process.env.PORT);

const start = async () => {
	const server = await buildServer()
	try {
		await server.listen({ port: PORT });
	} catch (err) {
		server.log.error(err);
		process.exit(1);
	}
};

start();
