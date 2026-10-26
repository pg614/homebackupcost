// ONE switch for all email features. Off until Friday (domain + accounts).
// Turn on at build time: PUBLIC_EMAIL_ENABLED=true PUBLIC_EMAIL_ENDPOINT=https://api.homebackupcost.com
export const EMAIL_ENABLED = import.meta.env.PUBLIC_EMAIL_ENABLED === 'true';
export const EMAIL_ENDPOINT = (import.meta.env.PUBLIC_EMAIL_ENDPOINT || '').replace(/\/$/, '');
export const EMAIL_LIVE = EMAIL_ENABLED && !!EMAIL_ENDPOINT;
export const CONSENT_TEXT = 'Send me my report and occasional backup power tips; unsubscribe anytime.';
