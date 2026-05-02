
import { z } from 'zod';

/**
 * Safely extracts a message from an unknown error object.
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof z.ZodError) {
    return error.issues.map((e: z.ZodIssue) => `${e.path.join('.')}: ${e.message}`).join(', ');
  }
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  if (error && typeof error === 'object' && 'message' in error) {
    return String((error as { message: unknown }).message);
  }
  return "An unknown error occurred";
}

/**
 * Safely extracts an appropriate HTTP status code from an error.
 */
export function getErrorStatusCode(error: unknown): number {
  if (error instanceof z.ZodError) return 400;
  if (isErrorWithStatusCode(error, 401)) return 401;
  if (isErrorWithStatusCode(error, 403)) return 403;
  if (isErrorWithStatusCode(error, 404)) return 404;
  if (isErrorWithStatusCode(error, 409)) return 409;
  
  // Check for Supabase Auth errors
  if (error && typeof error === 'object' && 'status' in error && typeof (error as any).status === 'number') {
    return (error as any).status;
  }
  
  return 500;
}

/**
 * Checks if an error object has a specific status code.
 */
export function isErrorWithStatusCode(error: unknown, statusCode: number): boolean {
  return (
    error !== null &&
    typeof error === 'object' &&
    'status' in error &&
    (error as { status: unknown }).status === statusCode
  );
}
