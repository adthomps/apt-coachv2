/**
 * APT Fitness Coach — Structured API Error Handling
 * Provides consistent error propagation from API layer to UI.
 */

export class AppError extends Error {
  readonly code: string;
  readonly details?: Record<string, unknown>;

  constructor(code: string, message: string, details?: Record<string, unknown>) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.details = details;
  }
}

/** Common error codes */
export const ErrorCode = {
  NOT_FOUND: 'NOT_FOUND',
  VALIDATION: 'VALIDATION_ERROR',
  CONFLICT: 'CONFLICT',
  UNAUTHORIZED: 'UNAUTHORIZED',
  INTERNAL: 'INTERNAL_ERROR',
  NETWORK: 'NETWORK_ERROR',
} as const;

/** Extract a user-friendly message from any error */
export function getErrorMessage(error: unknown): string {
  if (error instanceof AppError) return error.message;
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  return 'An unexpected error occurred';
}

/** Wrap an async API call with consistent error handling */
export async function withErrorHandling<T>(
  fn: () => Promise<T>,
  context?: string,
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (error instanceof AppError) throw error;
    const message = context
      ? `${context}: ${getErrorMessage(error)}`
      : getErrorMessage(error);
    throw new AppError(ErrorCode.INTERNAL, message);
  }
}
