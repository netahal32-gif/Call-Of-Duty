import { errorResponseSchema } from '../types/general.js'
import {
  SoldierBodyToUpdateSchema,
  soldierAddLimitationsSchema,
  soldierIdParamSchema,
  soldierQuerySchema,
  soldierResponseSchema,
  soldierSchema,
  soldiersArrayResponseSchema,
} from '../types/soldier.js'

export const deleteSchema = {
  schema: {
    params: soldierIdParamSchema,
    response: {
      204: { type: 'null' },
      404: errorResponseSchema,
    },
  },
}

export const getByIdSchema = {
  schema: {
    params: soldierIdParamSchema,
    response: {
      200: soldierResponseSchema,
      404: errorResponseSchema,
    },
  },
}

export const getByParamsSchema = {
  schema: {
    querystring: soldierQuerySchema,
    response: {
      200: soldiersArrayResponseSchema,
      404: errorResponseSchema,
    },
  },
}

export const patchSchema = {
  schema: {
    body: SoldierBodyToUpdateSchema,
    params: soldierIdParamSchema,
    response: {
      200: soldierResponseSchema,
      404: errorResponseSchema,
    },
  },
}

export const postSchema = {
  schema: {
    body: soldierSchema,
    response: {
      201: soldierResponseSchema,
    },
  },
}

export const putLimitationsSchema = {
  schema: {
    body: soldierAddLimitationsSchema,
    params: soldierIdParamSchema,
    response: {
      200: soldierResponseSchema,
      404: errorResponseSchema,
    },
  },
}
