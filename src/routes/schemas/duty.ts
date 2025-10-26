import { z } from 'zod'
import { timestampsSchema } from './soldier.js';

export const baseDutySchema = z.object({
    name: z.string().min(3).max(50),
    description: z.string(),
    location: z.array(z.number()).min(2).max(3),
    startTime: z.coerce.date().refine(
        (date) => date > new Date(),
        {
            message: 'Date must be in the future',
        }
    ),
    endTime: z.coerce.date().refine(
        (date) => date > new Date(),
        {
            message: 'Date must be in the future',
        }
    ),
    constraints: z.array(z.string()),
    soldiersRequired: z.number(),
    value: z.number().positive(),
    minRank: z
        .coerce
        .number()
        .refine(v => v >= 0 && v <= 6, 'Value must be between 0 and 6')
        .optional(),
    maxRank: z
        .coerce
        .number()
        .refine(v => v >= 0 && v <= 6, 'Value must be between 0 and 6')
        .optional(),
})
    .refine((data) => data.startTime < data.endTime, {
        message: 'startTime must be before endTime',
        path: ['startTime'],
    })
    .refine(
        (data) =>
            data.minRank === undefined || data.maxRank === undefined || data.minRank <= data.maxRank,
        {
            message: 'minRank cannot be greater than maxRank',
            path: ['minRank'],
        }
    );

export const extrasDutySchema = z.object({
    soldiers: z.array(z.string()).default([]),
    status: z.string().default("unscheduled"),
    statusHistory: z
        .array(
            z.object({
                status: z.string(),
                date: z.date(),
            })
        )
        .default(() => [{ status: "unscheduled", date: new Date() }]),
});


export const dutySchema = baseDutySchema
    .merge(extrasDutySchema)
    .merge(timestampsSchema)
    .refine((data) => data.startTime < data.endTime, {
        message: 'startTime must be before endTime',
        path: ['startTime'],
    })
    .refine(
        (data) =>
            data.minRank === undefined ||
            data.maxRank === undefined ||
            data.minRank <= data.maxRank,
        {
            message: 'minRank cannot be greater than maxRank',
            path: ['minRank'],
        }
    )
    
export const dutyResponseSchema = z.object({
    message: z.string(),
    data: dutySchema,
});

export type baseDuty = z.infer<typeof baseDutySchema>

export type duty = z.infer<typeof dutySchema>