export async function onRequest(context) {
  const { request } = context;
  const reqUrl = new URL(request.url);
  const target = reqUrl.searchParams.get('url');

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
          const headers = new Headers();
          headers.set('Content-Type', contentType);
          headers.set('Access-Control-Allow-Origin', '*');
          headers.set('Cache-Control', 'public, max-age=86400');
          return new Response(resp.body, { status: 200, headers });
        }
      }
    } catch (e) {
      // Continue to next fallback
    }
  }

  // Fallback to local default avatar
  return Response.redirect(new URL('/images/avatars/perfil-sem-foto.jpeg', request.url), 302);
}
