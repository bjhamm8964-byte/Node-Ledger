const CACHE_NAME = 'node-ledger-v1.7';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './icon.png'
];

// 安装阶段：缓存所有静态资源
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('📦 [SW] 缓存核心文件');
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// 激活阶段：清理旧版本缓存
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

// 拦截请求：优先读取缓存，离线可用
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // 缓存里有就直接返回，没有就去网络请求
      return cachedResponse || fetch(event.request);
    })
  );
});
