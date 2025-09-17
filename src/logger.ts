import { pino, type Logger } from "pino";

const logger: Logger = pino({
	transport: {
		target: "pino-pretty",
		options: {
			colorize: true,
		},
	},
	level: "info", //process.env.PINO_LOG_LEVEL ||
});

export default{ logger };
