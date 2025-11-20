import { errorResponseSchema } from '../types/general.js'
import { justiceArrayResponseSchema, justiceResponseSchema } from '../types/justice-board.js'
import { soldierIdParamSchema } from '../types/soldier.js'

export const getAllScoresSchema = {
  schema: {
    response: {
      200: justiceArrayResponseSchema,
    },
  },
}

export const getByIdSchema = {
  schema: {
    params: soldierIdParamSchema,
    response: {
      200: justiceResponseSchema,
      404: errorResponseSchema,
    },
  },
}
