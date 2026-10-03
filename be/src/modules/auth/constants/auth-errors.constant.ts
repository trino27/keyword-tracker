import { API_ERROR_CODES } from '@app/contracts';

/** The auth module's slice of the error catalogue — codes come from `@app/contracts`. */
export const AUTH_ERRORS = {
  INVALID_CREDENTIALS: {
    code: API_ERROR_CODES.INVALID_CREDENTIALS,
    // One sentence for an unknown email and a wrong password: never reveal which.
    message: 'Email or password is incorrect',
  },
  SESSION_REQUIRED: {
    code: API_ERROR_CODES.SESSION_REQUIRED,
    message: 'Sign in to continue',
  },
} as const;
