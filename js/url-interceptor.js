(function () {
    const OLD_URLS = [
        'https://proxt-insta.projetinho-solo.workers.dev',
        'http://proxt-insta.projetinho-solo.workers.dev',
        'https://mr.userfounded.workers.dev',
        'http://mr.userfounded.workers.dev',
        'https://userfounded.workers.dev',
        'http://userfounded.workers.dev'
    ];
    const OLD_CHECKOUTS = [
        'checkout.perfectpay.com.br',
        'go.perfectpay.com.br',
        'perfectpay.com.br',
        'PPU38CQEU88',
        'PPU38CQ72R6'
    ];
    const NEW_CHECKOUT = 'https://www.seguropagamentos.com.br/stalke-ia';
    const LOCAL_PROXY = '/api/proxy/image-proxy.php';
    const SST_DOMAIN = 'sst.stalkeia.website';

    function replaceUrl(url) {
        if (typeof url !== 'string' || !url) return url;

        for (const oldCheckout of OLD_CHECKOUTS) {
            if (url.includes(oldCheckout)) {
                try {
                    const parsed = new URL(url, window.location.origin);
                    const targetParams = parsed.search;
                    return targetParams ? `${NEW_CHECKOUT}${targetParams}` : NEW_CHECKOUT;
                } catch (e) {
                    return NEW_CHECKOUT;
                }
            }
        }

        for (const oldUrl of OLD_URLS) {
            if (url.includes(oldUrl)) {
                try {
                    const parsed = new URL(url, window.location.origin);
                    const target = parsed.searchParams.get('url');
                    if (target) {
                        return `${LOCAL_PROXY}?url=${encodeURIComponent(target)}`;
                    }
                } catch (e) {}
                return url.replace(oldUrl, LOCAL_PROXY);
            }
        }

        if ((url.includes('cdninstagram.com') || url.includes('fbcdn.net')) && !url.includes('image-proxy.php')) {
            return `${LOCAL_PROXY}?url=${encodeURIComponent(url)}`;
        }

        return url;
    }

    function isSstRequest(url) {
        return typeof url === 'string' && url.includes(SST_DOMAIN);
    }

    // Intercept Fetch
    const originalFetch = window.fetch;
    window.fetch = function (input, init) {
        if (typeof input === 'string') {
            if (isSstRequest(input)) return originalFetch.call(this, input, init);
            input = replaceUrl(input);
        } else if (input instanceof URL) {
            if (isSstRequest(input.toString())) return originalFetch.call(this, input, init);
            const newUrlStr = replaceUrl(input.toString());
            input = new URL(newUrlStr, window.location.origin);
        } else if (input instanceof Request) {
            if (isSstRequest(input.url)) return originalFetch.call(this, input, init);
            const newUrl = replaceUrl(input.url);
            input = new Request(newUrl, input);
        }
        return originalFetch.call(this, input, init);
    };

    // Intercept XMLHttpRequest
    const originalOpen = XMLHttpRequest.prototype.open;
    XMLHttpRequest.prototype.open = function (method, url) {
        if (isSstRequest(url)) return originalOpen.apply(this, arguments);
        arguments[1] = replaceUrl(url);
        return originalOpen.apply(this, arguments);
    };

    // DOM Interceptor
    function processNode(node) {
        if (node.nodeType === Node.ELEMENT_NODE) {
            const attrs = ['src', 'href', 'data-src', 'data-href'];
            attrs.forEach(attr => {
                const value = node.getAttribute(attr);
                if (value) {
                    const replaced = replaceUrl(value);
                    if (replaced !== value) {
                        node.setAttribute(attr, replaced);
                    }
                }
            });
        }
        if (node.childNodes) {
            node.childNodes.forEach(processNode);
        }
    }

    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            mutation.addedNodes.forEach((node) => {
                processNode(node);
            });
            if (mutation.type === 'attributes') {
                const attr = mutation.attributeName;
                const value = mutation.target.getAttribute(attr);
                if (value) {
                    const replaced = replaceUrl(value);
                    if (replaced !== value) {
                        mutation.target.setAttribute(attr, replaced);
                    }
                }
            }
        });
    });

    observer.observe(document.documentElement, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['src', 'href', 'data-src', 'data-href']
    });

    // Intercept window.open
    const originalWindowOpen = window.open;
    window.open = function (targetUrl, target, features) {
        if (typeof targetUrl === 'string') {
            targetUrl = replaceUrl(targetUrl);
        }
        return originalWindowOpen.call(window, targetUrl, target, features);
    };

    // Global click interceptor
    document.addEventListener('click', function (e) {
        try {
            const anchor = e.target && e.target.closest ? e.target.closest('a') : null;
            if (anchor && anchor.href) {
                const replaced = replaceUrl(anchor.href);
                if (replaced !== anchor.href) {
                    anchor.href = replaced;
                }
            }
        } catch (err) {}
    }, true);

    // Initial pass
    processNode(document.documentElement);
})();
