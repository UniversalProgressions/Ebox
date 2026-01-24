/**
 * Database and business logic error types for Civitai Manager
 */

export class DatabaseError extends Error {
  constructor(
    message: string, 
    public readonly originalError?: unknown,
    public readonly operation?: string
  ) {
    super(message);
    this.name = 'DatabaseError';
  }
}

export class BusinessLogicError extends Error {
  constructor(
    message: string, 
    public readonly code?: string,
    public readonly context?: Record<string, any>
  ) {
    super(message);
    this.name = 'BusinessLogicError';
  }
}

export class ValidationError extends BusinessLogicError {
  constructor(message: string, context?: Record<string, any>) {
    super(message, 'VALIDATION_ERROR', context);
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends BusinessLogicError {
  constructor(message: string, context?: Record<string, any>) {
    super(message, 'NOT_FOUND', context);
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends BusinessLogicError {
  constructor(message: string, context?: Record<string, any>) {
    super(message, 'CONFLICT', context);
    this.name = 'ConflictError';
  }
}

/**
 * Utility function to wrap Prisma operations with error handling
 */
export async function withDatabaseErrorHandling<T>(
  operation: string,
  fn: () => Promise<T>
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    throw new DatabaseError(
      `Database operation failed: ${operation}`,
      error,
      operation
    );
  }
}

/**
 * Utility function to handle validation errors from neverthrow Results
 */
export function handleValidationResult<T>(
  result: { isOk: () => boolean; isErr: () => boolean; value?: T; error?: Error },
  context?: Record<string, any>
): T {
  if (result.isOk() && result.value !== undefined) {
    return result.value;
  }
  
  if (result.isErr() && result.error) {
    throw new ValidationError(
      result.error.message,
      { ...context, originalError: result.error }
    );
  }
  
  throw new ValidationError(
    'Unknown validation error',
    context
  );
}