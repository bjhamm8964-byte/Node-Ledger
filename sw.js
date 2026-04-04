const CACHE_NAME = 'node-ledger-v2';  // 改成新版本号，强制更新缓存

const ASSETS_TO_CACHE = [
  '/Node-Ledger/',
  '/Node-Ledger/index.html',
  '/Node-Ledger/manifest.json',
  '/Node-Ledger/icon.png',
  '/Node-Ledger/sw.js'          // 必须加上 SW 自身！
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('📦 [SW] 缓存核心文件');
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(keyList.map((key) => {
        if (key !== CACHE_NAME) {
          console.log('🗑️ [SW] 删除旧缓存', key);
          return caches.delete(key);
        }
      }));
    })
  );
  self.clients.claim();
});

// 改进的 fetch：优先缓存，网络失败时回退缓存（对 iOS 更友好）
self.addEventListener('fetch', (event) => {
  // 只处理 GET 请求
  if (event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    caches.match(event.request, { ignoreSearch: true })  // 忽略查询参数，增加命中率
      .then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        // 没有缓存就尝试网络，并把成功响应存入缓存（动态缓存）
        return fetch(event.request).then((response) => {
          if (!response || response.status !== 200) {
            return response;
          }
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
          return response;
        }).catch(() => {
          // 离线时，如果是导航请求（打开页面），至少返回 index.html
          if (event.request.mode === 'navigate') {
            return caches.match('/Node-Ledger/index.html');
          }
          return new Response('Offline', { status: 503 });
        });
      })
  );
});
