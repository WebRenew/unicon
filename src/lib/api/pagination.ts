export interface ParsedPagination {
  limit: number;
  offset: number;
}

export interface PaginationValidationError {
  error: string;
}

type ParsePaginationResult = ParsedPagination | PaginationValidationError;

export interface PaginatedSlice<T> {
  items: T[];
  hasMore: boolean;
}

function isValidationError(
  result: number | PaginationValidationError
): result is PaginationValidationError {
  return typeof result !== "number";
}

function parseIntegerInput(
  value: unknown,
  field: "limit" | "offset"
): number | PaginationValidationError {
  if (typeof value === "number") {
    if (!Number.isInteger(value) || !Number.isFinite(value)) {
      return { error: `${field} must be an integer` };
    }
    return value;
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!/^-?\d+$/.test(trimmed)) {
      return { error: `${field} must be an integer` };
    }

    const parsed = Number.parseInt(trimmed, 10);
    if (!Number.isSafeInteger(parsed)) {
      return { error: `${field} must be an integer` };
    }
    return parsed;
  }

  return { error: `${field} must be an integer` };
}

export function parsePagination(params: {
  limit: unknown;
  offset: unknown;
  defaultLimit: number;
  maxLimit: number;
}): ParsePaginationResult {
  const parsedLimit =
    params.limit === undefined || params.limit === null
      ? params.defaultLimit
      : parseIntegerInput(params.limit, "limit");

  if (isValidationError(parsedLimit)) {
    return parsedLimit;
  }

  const parsedOffset =
    params.offset === undefined || params.offset === null
      ? 0
      : parseIntegerInput(params.offset, "offset");

  if (isValidationError(parsedOffset)) {
    return parsedOffset;
  }

  if (parsedLimit < 1 || parsedLimit > params.maxLimit) {
    return {
      error: `limit must be between 1 and ${params.maxLimit}`,
    };
  }

  if (parsedOffset < 0) {
    return {
      error: "offset must be greater than or equal to 0",
    };
  }

  return {
    limit: parsedLimit,
    offset: parsedOffset,
  };
}

/**
 * Builds paginated output from a "limit + 1" result set.
 *
 * Callers should fetch one extra row. If present, we know there is a next page.
 */
export function sliceForPagination<T>(rows: T[], limit: number): PaginatedSlice<T> {
  const hasMore = rows.length > limit;
  return {
    items: hasMore ? rows.slice(0, limit) : rows,
    hasMore,
  };
}
