import type { FastifyInstance } from 'fastify'
import { dbCheck } from './soldierHelpers.js'
import type { baseDuty, duty } from '../schemas/duty.js';
import { baseDutySchema } from '../schemas/duty.js';

export const postDuty = async (server: FastifyInstance, body: baseDuty) => {
    const db = dbCheck(server)

    const collections = await db.listCollections({ name: 'duties' }).toArray();
    if (collections.length === 0) {
        await db.createCollection('duties');
        server.log.info('Created "duties" collection');
    }

    const parseResult = baseDutySchema.safeParse(body)
    if (!parseResult.success) {
        throw new Error('Invalid duty data');
    }

    const currentDate = new Date()
    const duty: duty = {
        ...parseResult.data,
        soldiers: [],
        status: 'unscheduled',
        statusHistory: [{ status: 'unscheduled', date: currentDate }],
        createdAt: currentDate,
        updatedAt: currentDate,
    }

    const collection = db.collection<duty>('duties')
    await collection.insertOne(duty)
    return duty
}