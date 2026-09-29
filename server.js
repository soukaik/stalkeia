const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const url = require('url');
const zlib = require('zlib');

const PORT = process.env.PORT || 3000;
const ROOT = __dirname;

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.mp4': 'video/mp4',
  '.mp3': 'audio/mpeg'
};

function serveFallbackAvatar(res) {
  if (res.headersSent) return;
  const fallbackPath = path.join(ROOT, 'images', 'avatars', 'perfil-sem-foto.jpeg');
  if (fs.existsSync(fallbackPath)) {
    try {
      res.writeHead(200, {
        'Content-Type': 'image/jpeg',
        'Access-Control-Allow-Origin': '*',
        'Cross-Origin-Resource-Policy': 'cross-origin',
        'Cache-Control': 'public, max-age=86400'
      });
      fs.createReadStream(fallbackPath).pipe(res);
    } catch (e) {
      if (!res.headersSent) {
        res.writeHead(200, { 'Content-Type': 'image/jpeg' });
        res.end();
      }
    }
  } else {
    try {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Avatar not found');
    } catch (e) {}
  }
}

function fallbackToUpstreamImageProxy(imgUrl, req, res) {
  if (res.headersSent) return;
  let handled = false;
  const finish = (fn) => {
    if (handled || res.headersSent) return;
    handled = true;
    fn();
  };

  const targetHost = 'stalkeia.website';
  const targetPath = '/api/proxy/image-proxy.php?url=' + encodeURIComponent(imgUrl);
  const options = {
    hostname: targetHost,
    port: 443,
    path: targetPath,
    method: 'GET',
    headers: {
      host: targetHost,
      referer: 'https://stalkeia.website/',
      origin: 'https://stalkeia.website',
      'x-site-key': 'f36ea0b8b6c2a6bbd745bc50e473bfc5b39d0c2a075a38e9',
      'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
  };

  const fallbackReq = https.request(options, (fallbackRes) => {
    if (fallbackRes.statusCode === 200) {
      finish(() => {
        res.writeHead(200, {
          'Content-Type': fallbackRes.headers['content-type'] || 'image/jpeg',
          'Access-Control-Allow-Origin': '*',
          'Cross-Origin-Resource-Policy': 'cross-origin',
          'Cache-Control': 'public, max-age=86400'
        });
        fallbackRes.pipe(res);
      });
    } else {
      finish(() => serveFallbackAvatar(res));
    }
  });

  fallbackReq.on('error', () => {
    finish(() => serveFallbackAvatar(res));
  });

  fallbackReq.setTimeout(6000, () => {
    try { fallbackReq.destroy(); } catch (e) {}
    finish(() => serveFallbackAvatar(res));
  });

  fallbackReq.end();
}

function fetchAndStreamImage(imgUrl, req, res, redirectCount) {
  if (res.headersSent) return;
  if (redirectCount > 3) {
    return serveFallbackAvatar(res);
  }

  let parsed;
  try {
    parsed = new URL(imgUrl);
  } catch (e) {
    return serveFallbackAvatar(res);
  }

  let handled = false;
  const finishFallback = () => {
    if (handled || res.headersSent) return;
    handled = true;
    fallbackToUpstreamImageProxy(imgUrl, req, res);
  };

  const client = parsed.protocol === 'https:' ? https : http;
  const options = {
    hostname: parsed.hostname,
    port: parsed.port || (parsed.protocol === 'https:' ? 443 : 80),
    path: parsed.pathname + parsed.search,
    method: 'GET',
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
      'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
      'Sec-Fetch-Dest': 'image',
      'Sec-Fetch-Mode': 'no-cors',
      'Sec-Fetch-Site': 'cross-site'
    }
  };

  const imgReq = client.request(options, (imgRes) => {
    if (imgRes.statusCode >= 300 && imgRes.statusCode < 400 && imgRes.headers.location) {
      const redirectUrl = new URL(imgRes.headers.location, imgUrl).toString();
      handled = true;
      return fetchAndStreamImage(redirectUrl, req, res, redirectCount + 1);
    }

    if (imgRes.statusCode !== 200) {
      console.warn(`[ImageProxy] Status ${imgRes.statusCode} for ${imgUrl.slice(0, 60)}... trying fallback`);
      return finishFallback();
    }

    if (handled || res.headersSent) return;
    handled = true;

    const contentType = imgRes.headers['content-type'] || 'image/jpeg';
    res.writeHead(200, {
      'Content-Type': contentType,
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
      'Cross-Origin-Resource-Policy': 'cross-origin',
      'Cache-Control': 'public, max-age=86400'
    });
    imgRes.pipe(res);
  });

  imgReq.on('error', (err) => {
    console.warn(`[ImageProxy] Error: ${err.message}. Trying fallback...`);
    finishFallback();
  });

  imgReq.setTimeout(8000, () => {
    try { imgReq.destroy(); } catch (e) {}
    finishFallback();
  });

  imgReq.end();
}

function handleImageProxy(req, res, parsedUrl) {
  let targetUrl = parsedUrl.query.url;
  if (!targetUrl) {
    return serveFallbackAvatar(res);
  }

  try {
    targetUrl = decodeURIComponent(targetUrl);
  } catch (e) {}

  while (targetUrl.includes('workers.dev') && targetUrl.includes('url=')) {
    try {
      const inner = new URL(targetUrl).searchParams.get('url');
      if (inner) {
        targetUrl = decodeURIComponent(inner);
      } else {
        break;
      }
    } catch (e) {
      break;
    }
  }

  if (targetUrl.startsWith('/') || targetUrl.startsWith('data:')) {
    const localFile = path.join(ROOT, targetUrl.replace(/^\//, ''));
    if (fs.existsSync(localFile)) {
      res.writeHead(200, {
        'Content-Type': 'image/jpeg',
        'Access-Control-Allow-Origin': '*',
        'Cross-Origin-Resource-Policy': 'cross-origin'
      });
      return fs.createReadStream(localFile).pipe(res);
    }
  }

  fetchAndStreamImage(targetUrl, req, res, 0);
}

function handleApiProxy(req, res, parsedUrl) {
  const targetHost = 'stalkeia.website';
  const targetPath = parsedUrl.path;

  const headers = {
    ...req.headers,
    host: targetHost,
    referer: 'https://stalkeia.website/',
    origin: 'https://stalkeia.website',
    'x-site-key': 'f36ea0b8b6c2a6bbd745bc50e473bfc5b39d0c2a075a38e9',
    'user-agent': req.headers['user-agent'] || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
  };
  delete headers['content-length'];

  const options = {
    hostname: targetHost,
    port: 443,
    path: targetPath,
    method: req.method,
    headers: headers
  };

  const proxyReq = https.request(options, (proxyRes) => {
    res.writeHead(proxyRes.statusCode, {
      ...proxyRes.headers,
      'access-control-allow-origin': '*',
      'access-control-allow-methods': 'GET, POST, OPTIONS',
      'access-control-allow-headers': '*'
    });
    proxyRes.pipe(res);
  });

  proxyReq.on('error', (err) => {
    console.error('Proxy Error:', err.message);
    res.writeHead(502, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: false, error: 'Proxy error: ' + err.message }));
  });

  if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
    req.pipe(proxyReq);
  } else {
    proxyReq.end();
  }
}

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  let pathname = decodeURIComponent(parsedUrl.pathname);

  // Enable CORS for all
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': '*'
    });
    res.end();
    return;
  }

  // Handle image proxy
  if (pathname === '/api/proxy/image-proxy.php' || pathname === '/api/image-proxy') {
    handleImageProxy(req, res, parsedUrl);
    return;
  }

  // Handle lead tracking locally (disable external tracking delays)
  if (pathname.includes('leads.php')) {
    res.writeHead(200, {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': '*'
    });
    res.end(JSON.stringify({ success: true, exists: false, canSearch: true }));
    return;
  }

  // Handle other API proxy (e.g. HikerAPI)
  if (pathname.startsWith('/api/proxy')) {
    handleApiProxy(req, res, parsedUrl);
    return;
  }

  // Rota secreta de acesso VIP
  if (pathname === '/acesso-liberado-7k2xp9sv' || pathname === '/acesso-liberado-7k2xp9sv.html') {
    const vipPage = path.join(ROOT, 'acesso-liberado-7k2xp9sv.html');
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' });
    fs.createReadStream(vipPage).pipe(res);
    return;
  }

  // Clean pathname
  if (pathname === '/') {
    pathname = '/index.html';
  }

  let filePath = path.join(ROOT, pathname);

  // Security check: ensure within ROOT
  if (!filePath.startsWith(ROOT)) {
    res.writeHead(403);
    res.end('Access Denied');
    return;
  }

  fs.stat(filePath, (err, stats) => {
    if (!err && stats.isFile()) {
      const ext = path.extname(filePath).toLowerCase();
      const contentType = MIME_TYPES[ext] || 'application/octet-stream';
      const isDynamic = ext === '.html' || ext === '.js' || ext === '.json' || ext === '.css';
      const acceptEncoding = req.headers['accept-encoding'] || '';

      const headers = {
        'Content-Type': contentType,
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': isDynamic ? 'no-cache, no-store, must-revalidate' : 'public, max-age=86400',
        'Pragma': isDynamic ? 'no-cache' : 'public'
      };

      if (isDynamic && acceptEncoding.includes('gzip')) {
        headers['Content-Encoding'] = 'gzip';
        res.writeHead(200, headers);
        fs.createReadStream(filePath).pipe(zlib.createGzip({ level: 6 })).pipe(res);
      } else {
        res.writeHead(200, headers);
        fs.createReadStream(filePath).pipe(res);
      }
    } else {
      // SPA fallback: if request is a page route without extension, serve index.html
      if (!path.extname(pathname)) {
        const indexPath = path.join(ROOT, 'index.html');
        const acceptEncoding = req.headers['accept-encoding'] || '';
        const headers = {
          'Content-Type': 'text/html; charset=utf-8',
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        };

        if (acceptEncoding.includes('gzip')) {
          headers['Content-Encoding'] = 'gzip';
          res.writeHead(200, headers);
          fs.createReadStream(indexPath).pipe(zlib.createGzip({ level: 6 })).pipe(res);
        } else {
          res.writeHead(200, headers);
          fs.createReadStream(indexPath).pipe(res);
        }
      } else {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('404 Not Found');
      }
    }
  });
});

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
