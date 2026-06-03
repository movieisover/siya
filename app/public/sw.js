const CACHE_NAME = 'siya-v2';

// 앱 셸 — 오프라인에서도 로딩 화면이 뜨도록 최소한만 캐시
const SHELL_URLS = [
  '/',
  '/manifest.json',
  '/icon-512.svg',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_URLS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  // 이전 버전 캐시 삭제
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // API / Supabase / 외부 요청은 캐시하지 않고 네트워크 직행
  if (
    url.hostname !== self.location.hostname ||
    url.pathname.startsWith('/rest/') ||
    url.pathname.startsWith('/auth/') ||
    url.pathname.startsWith('/functions/')
  ) {
    return;
  }

  // 앱 셸: 캐시 우선, 실패 시 네트워크
  event.respondWith(
    caches.match(request).then((cached) => cached || fetch(request))
  );
});
