import { z } from 'zod';

import { RequestErrors } from '../errors/catalog.js';
import { PAGINATION_DEFAULT_LIMIT, PAGINATION_MAX_LIMIT } from '../config.js';

const CursorPaginationQuerySchema = z
  .object({
    limit: z.preprocess((value) => {
      if (value === undefined) {
        return PAGINATION_DEFAULT_LIMIT;
      }

      if (typeof value === 'string' && value.trim().length > 0) {
        return Number(value);
      }

      return value;
    }, z.number().int().min(1).max(PAGINATION_MAX_LIMIT)),
    cursor: z.preprocess((value) => {
      if (typeof value === 'string' && value.trim().length > 0) {
        return value;
      }

      return undefined;
    }, z.string().min(1).optional()),
  })
  .strict();

const EncodedCursorSchema = z.object({
  id: z.string().min(1),
  createdAt: z.iso.datetime(),
});

export type DateIdCursor = {
  id: string;
  createdAt: Date;
};

export function parseCursorPaginationFromQuery(query: unknown) {
  const parsed = CursorPaginationQuerySchema.safeParse(query);
  if (!parsed.success) {
    throw RequestErrors.badRequest(parsed.error.issues);
  }

  return {
    limit: parsed.data.limit,
    cursor: parsed.data.cursor ? decodeDateIdCursorFromB64(parsed.data.cursor) : null,
  };
}

export function encodeDateIdCursorToB64(cursor: { id: string; createdAt: Date | string }) {
  const payload = {
    id: cursor.id,
    createdAt: cursor.createdAt instanceof Date ? cursor.createdAt.toISOString() : cursor.createdAt,
  };

  return Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
}

export function decodeDateIdCursorFromB64(cursor: string): DateIdCursor {
  let parsedJson: unknown;

  try {
    const decoded = Buffer.from(cursor, 'base64url').toString('utf8');
    parsedJson = JSON.parse(decoded);
  } catch {
    throw RequestErrors.badRequest([
      {
        code: 'custom',
        path: ['cursor'],
        message: 'Invalid cursor',
      },
    ]);
  }

  const parsed = EncodedCursorSchema.safeParse(parsedJson);
  if (!parsed.success) {
    throw RequestErrors.badRequest([
      {
        code: 'custom',
        path: ['cursor'],
        message: 'Invalid cursor',
      },
    ]);
  }

  return {
    id: parsed.data.id,
    createdAt: new Date(parsed.data.createdAt),
  };
}

export function buildDescDateIdCursor(
  cursor: DateIdCursor,
  fields: {
    idField?: string;
    createdAtField?: string;
  } = {},
) {
  const idField = fields.idField ?? 'id';
  const createdAtField = fields.createdAtField ?? 'createdAt';

  return {
    OR: [
      {
        [createdAtField]: {
          lt: cursor.createdAt,
        },
      },
      {
        [createdAtField]: cursor.createdAt,
        [idField]: {
          lt: cursor.id,
        },
      },
    ],
  };
}

export function getCursorPage<T>(
  items: T[],
  limit: number,
  getCursor: (item: T) => { id: string; createdAt: Date | string },
) {
  const hasMore = items.length > limit;
  const pageItems = hasMore ? items.slice(0, limit) : items;

  return {
    items: pageItems,
    hasMore,
    nextCursor:
      hasMore && pageItems.length > 0
        ? encodeDateIdCursorToB64(getCursor(pageItems[pageItems.length - 1]!))
        : null,
  };
}
