/**
 * Defines the possible status outcomes for an API response.
 */
export type APIStatus = 'success' | 'error' | 'fail';

/**
 * Defines a standard, generic structure for all API responses.
 * * @template T The type of the main data payload in a successful response.
 */
export interface APIResponse<T> {
  /**
   * Status of the request: 'success', 'error', or 'fail'.
   */
  status: APIStatus;

  /**
   * A human-readable message providing details or context (optional for success).
   */
  message?: string;

  /**
   * The primary data payload. Its structure is determined by the generic type T.
   * Note: This field may be omitted or set to null/undefined on error/fail statuses.
   */
  data?: T | null;
}
