export default function adminLoginRateLimit() {}

export const config = {
  path: '/api/admin-session',
  method: 'POST',
  rateLimit: { windowSize: 60, windowLimit: 10, aggregateBy: ['ip', 'domain'] },
};
