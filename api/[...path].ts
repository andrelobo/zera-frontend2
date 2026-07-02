const DEFAULT_UPSTREAM = 'http://136.248.90.172:3000';

function buildUpstreamUrl(requestUrl: string) {
  const publicUrl = new URL(requestUrl);
  const upstreamBase = process.env.ORACLE_BACKEND_URL?.trim() || DEFAULT_UPSTREAM;
  const normalizedBase = upstreamBase.endsWith('/') ? upstreamBase.slice(0, -1) : upstreamBase;
  const upstreamPath = publicUrl.pathname.replace(/^\/api/, '') || '/';
  return `${normalizedBase}${upstreamPath}${publicUrl.search}`;
}

export default {
  async fetch(request: Request) {
    const upstreamUrl = buildUpstreamUrl(request.url);
    const headers = new Headers(request.headers);

    headers.delete('host');
    headers.set('x-forwarded-host', new URL(request.url).host);
    headers.set('x-forwarded-proto', 'https');

    const init: RequestInit = {
      method: request.method,
      headers,
      redirect: 'manual',
    };

    if (request.method !== 'GET' && request.method !== 'HEAD') {
      init.body = await request.arrayBuffer();
    }

    try {
      const upstreamResponse = await fetch(upstreamUrl, init);
      const responseHeaders = new Headers(upstreamResponse.headers);
      responseHeaders.set('x-zera-proxy', 'vercel-function');

      return new Response(upstreamResponse.body, {
        status: upstreamResponse.status,
        statusText: upstreamResponse.statusText,
        headers: responseHeaders,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown proxy error';
      return Response.json(
        {
          message: 'Oracle backend proxy request failed',
          upstreamUrl,
          error: message,
        },
        { status: 502 },
      );
    }
  },
};
