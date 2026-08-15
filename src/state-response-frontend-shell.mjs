import { readFile } from 'node:fs/promises';

export const STATE_RESPONSE_FRONTEND_PATH = '/state-responses';

const ASSETS = new Map([
  ['/state-responses.css', ['../public/state-responses.css', 'text/css; charset=utf-8']],
  ['/state-responses-enhanced.css', ['../public/state-responses-enhanced.css', 'text/css; charset=utf-8']],
  ['/state-responses.js', ['../public/state-responses.js', 'text/javascript; charset=utf-8']]
]);

async function asset(file, contentType) {
  return {statusCode: 200, contentType, body: await readFile(new URL(file, import.meta.url), 'utf8'), cacheControl: 'no-store'};
}

export async function resolveStateResponseFrontendRequest(pathname) {
  if (pathname === STATE_RESPONSE_FRONTEND_PATH || pathname === `${STATE_RESPONSE_FRONTEND_PATH}/`) {
    return {
      ...(await asset('../public/state-responses.html', 'text/html; charset=utf-8')),
      headers: {
        'content-security-policy': "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; base-uri 'none'; frame-ancestors 'none'; form-action 'none'",
        'x-content-type-options': 'nosniff',
        'referrer-policy': 'no-referrer'
      }
    };
  }
  const configured = ASSETS.get(pathname);
  if (!configured) return null;
  return {...(await asset(...configured)), headers: {'x-content-type-options': 'nosniff'}};
}
