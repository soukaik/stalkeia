export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, X-Site-Key',
        }
      });
    }

    // 1. HikerAPI proxy endpoint
    if (url.pathname === '/api/proxy/hikerapi.php') {
      const path = url.searchParams.get('path');
      if (!path) {
        return new Response(JSON.stringify({ error: 'Missing path parameter' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      }

      // Forward remaining query params (excluding 'path') to HikerAPI
      const forwardParams = new URLSearchParams();
      for (const [key, value] of url.searchParams.entries()) {
        if (key !== 'path') forwardParams.set(key, value);
      }
      const paramStr = forwardParams.toString();
      const hikerUrl = `https://api.hikerapi.com${path}${paramStr ? `?${paramStr}` : ''}`;

      try {
        const hikerResp = await fetch(hikerUrl, {
          method: request.method,
          headers: {
            'Content-Type': 'application/json',
            'x-access-key': request.headers.get('X-Site-Key') || '',
          },
          body: request.method !== 'GET' ? request.body : undefined,
        });

        const data = await hikerResp.text();
        return new Response(data, {
          status: hikerResp.status,
          headers: {
            'Content-Type': hikerResp.headers.get('content-type') || 'application/json',
            'Access-Control-Allow-Origin': '*',
          }
        });
      } catch (e) {
        return new Response(JSON.stringify({ error: 'HikerAPI request failed: ' + e.message }), {
          status: 502,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      }
    }

    // 2. Instagram image proxy endpoint
    if (url.pathname === '/api/proxy/image-proxy.php') {
      const target = url.searchParams.get('url');
      if (!target) {
        return Response.redirect(new URL('/images/avatars/perfil-sem-foto.jpeg', request.url), 302);
      }

      const upstreamProxies = [
        `https://proxt-insta.projetinho-solo.workers.dev/?url=${encodeURIComponent(target)}`,
        `https://mr.userfounded.workers.dev/?url=${encodeURIComponent(target)}`,
        target
      ];

      for (const proxyUrl of upstreamProxies) {
        try {
          const resp = await fetch(proxyUrl, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
              'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
              'Referer': 'https://www.instagram.com/'
            }
          });

          if (resp.ok) {
            const contentType = resp.headers.get('content-type') || 'image/jpeg';
            if (contentType.includes('image')) {
              const headers = new Headers(resp.headers);
              headers.set('Content-Type', contentType);
              headers.set('Access-Control-Allow-Origin', '*');
              headers.set('Cache-Control', 'public, max-age=86400');
              return new Response(resp.body, { status: 200, headers });
            }
          }
        } catch (e) {}
      }

      return Response.redirect(new URL('/images/avatars/perfil-sem-foto.jpeg', request.url), 302);
    }

    // 3. Leads endpoint (mock response)
    if (url.pathname === '/api/proxy/leads.php') {
      return new Response(JSON.stringify({ success: true, exists: false, canSearch: true }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

    // 3. Custom route for acesso-liberado
    const assets = env.STATIC_ASSETS || env.ASSETS;
    if (url.pathname === '/acesso-liberado-7k2xp9sv') {
      if (assets) {
        return assets.fetch(new Request(new URL('/acesso-liberado-7k2xp9sv.html', request.url), request));
      }
    }

    // 4. Serve static assets with SPA fallback
    if (assets) {
      return assets.fetch(request);
    }

    return new Response('Not Found', { status: 404 });
  }
};
