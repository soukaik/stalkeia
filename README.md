# StalkeIA - Web App

Aplicação web otimizada com funil completo, integração de rastreamento com UTMify e suporte nativo para deploy no **Cloudflare Pages**.

## 🚀 Deploy no Cloudflare Pages

1. Conecte este repositório ao **Cloudflare Pages**.
2. Nas configurações de Build:
   - **Framework preset**: `None`
   - **Build command**: *(deixe em branco ou `npm run build`)*
   - **Build output directory**: `.` *(ou deixe em branco para raiz)*
3. Clique em **Save and Deploy**.

### Recursos configurados para Cloudflare:
- **`_redirects`**: Roteamento SPA automático com status HTTP 200 (evita erros 404 em recarregamento de rotas como `/feed`, `/cta`, `/direct`, etc.).
- **`_headers`**: Configurações de cache e CORS para imagens e assets estáticos.
- **`functions/api/proxy/`**: Edge Functions serverless para proxy de imagens do Instagram (`image-proxy.php`) e leads (`leads.php`).

## 💻 Execução Local

```bash
npm start
```
Acesse: `http://localhost:3000`
