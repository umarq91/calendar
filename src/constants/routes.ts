/**
 * Centralized route literals. Never inline these in components.
 */
export const ROUTES = {
  // Public
  root: '/',

  // Auth
  signIn: '/auth/sign-in',
  signUp: '/auth/sign-up',
  forgot: '/auth/forgot',
  reset: '/auth/reset',
  checkEmail: '/auth/check-email',
  authCallback: '/auth/callback',

  // App (authenticated)
  dashboard: '/dashboard',
  send: '/send',
  contacts: '/contacts',
  campaigns: '/campaigns',
  smtp: '/settings/smtp',
  smtpNew: '/settings/smtp/new',
} as const;

/** Prefixes the proxy treats as authenticated. */
export const PROTECTED_PREFIXES = [
  '/dashboard',
  '/send',
  '/settings',
  '/campaigns',
  '/contacts',
] as const;
