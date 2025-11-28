// Auth utilities for handling unauthorized errors
// Reference: javascript_log_in_with_replit blueprint
export function isUnauthorizedError(error: Error): boolean {
  return /^401: .*Unauthorized/.test(error.message);
}
