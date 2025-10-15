import { afterAll, beforeAll, expect, test } from "vitest";
import type { FastifyInstance } from "fastify";
import buildServer from "../server.js";

let server: FastifyInstance;

beforeAll(async () => {
	process.env.NODE_ENV = "test";
	server = await buildServer();
});

afterAll(async () => {
	await server.close();
});

test("GET /health should return status OK", async () => {
	const response = await server.inject({
		method: "GET",
		url: "/health",
	});

	expect(response.statusCode).toBe(200);
	expect(response.json()).toEqual({ Server_Status: "ok" });
});

test("GET /health/db should return status OK", async () => {
	const response = await server.inject({
		method: "GET",
		url: "/health/db",
	});

	expect(response.statusCode).toBe(200);
	expect(response.json()).toEqual({ DB_Status: "ok" });
});
