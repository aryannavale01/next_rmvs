import { NextResponse } from 'next/server';

interface ApiErrorOptions {
  status: number;
  error: string;
  message?: string;
  details?: Record<string, string[]>;
  retryable?: boolean;
}

export function apiError({ status, error, message, details, retryable }: ApiErrorOptions) {
  const body: Record<string, unknown> = { error };
  if (message) body.message = message;
  if (details) body.details = details;
  if (retryable !== undefined) body.retryable = retryable;
  return NextResponse.json(body, { status });
}

export function unauthorizedError(message = 'Unauthorized') {
  return apiError({ status: 401, error: 'Unauthorized', message });
}

export function forbiddenError(message = 'Forbidden') {
  return apiError({ status: 403, error: 'Forbidden', message });
}

export function stepUpRequiredError(message = 'Step-up authentication required') {
  return apiError({ status: 403, error: 'STEP_UP_REQUIRED', message });
}

export function validationError(details: Record<string, string[]>) {
  return apiError({ status: 400, error: 'Invalid input', details });
}

export function rateLimitError(retryAfter?: number) {
  const res = apiError({ status: 429, error: 'Too many requests. Please try again later.' });
  if (retryAfter) res.headers.set('Retry-After', String(retryAfter));
  return res;
}

export function databaseError() {
  return apiError({
    status: 503,
    error: 'SERVICE_UNAVAILABLE',
    message: 'Database temporarily unavailable, please retry.',
    retryable: true,
  });
}

export function serverError(message = 'Internal server error') {
  return apiError({ status: 500, error: message });
}
