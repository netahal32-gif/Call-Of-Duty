import {
  baseDutySchema,
  dutySchema,
  constraintsSchema,
  dutiesArrayResponseSchema,
  dutyQuerySchema,
  dutyResponseSchema,
  mongoIdSchema,
  updateDutySchema,
} from '../types/duty.js'
import { errorResponseSchema } from '../types/general.js'

export const getByIdSchema = {
  schema: {
    params: mongoIdSchema,
    response: {
      200: dutyResponseSchema,
      404: errorResponseSchema,
    },
  },
}

export const getByParamsSchema = {
  schema: {
    querystring: dutyQuerySchema,
    response: {
      200: dutiesArrayResponseSchema,
      404: errorResponseSchema,
    },
  },
}

export const postSchema = {
  schema: {
    body: dutySchema,
    response: {
      201: dutyResponseSchema,
    },
  },
}

export const patchSchema = {
  schema: {
    body: updateDutySchema,
    params: mongoIdSchema,
    response: {
      200: dutyResponseSchema,
      404: errorResponseSchema,
      409: errorResponseSchema,
    },
  },
}

export const deleteSchema = {
  schema: {
    params: mongoIdSchema,
    response: {
      204: { type: 'null' },
      404: errorResponseSchema,
    },
  },
}

export const putConstrainsSchema = {
  schema: {
    body: constraintsSchema,
    params: mongoIdSchema,
    response: {
      200: dutyResponseSchema,
      404: errorResponseSchema,
      409: errorResponseSchema,
    },
  },
}
