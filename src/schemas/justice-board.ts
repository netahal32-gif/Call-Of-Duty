import { errorResponseSchema } from '../types/general.js'
import { justiceBoardArrayResponseSchema, justiceBoardResponseSchema } from '../types/justice-board.js'
import { soldierIdParamSchema } from '../types/soldier.js'

export const getAllScoresSchema = {
  schema: {
    response: {
      200: justiceBoardArrayResponseSchema,
      404: errorResponseSchema,
    },
  },
}

export const getByIdSchema = {
  schema: {
    params: soldierIdParamSchema,
    response: {
      200: justiceBoardResponseSchema,
      404: errorResponseSchema,
    },
  },
}
