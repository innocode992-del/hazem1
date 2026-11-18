const CACHE_NAME = 'save-my-words-v12';
const APP_FILES = ['./index.html','./manifest.webmanifest','./icon.svg','./icon-192.png','./icon-512.png'];
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(APP_FILES)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(
    keys.filter(key => key.startsWith('save-my-words-') && key !== CACHE_NAME).map(key => caches.delete(key))
  )).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
  const request=event.request;
  if(request.method!=='GET') return;
  const url=new URL(request.url), sameOrigin=url.origin===self.location.origin;
  const approved=/^(fonts\.googleapis\.com|fonts\.gstatic\.com|cdn\.jsdelivr\.net)$/.test(url.hostname);
  if(!sameOrigin&&!approved) return;
  event.respondWith((async()=>{
    try{
      const response=await fetch(request);
      if(response&&response.ok&&sameOrigin){
        const cache=await caches.open(CACHE_NAME);
        event.waitUntil(cache.put(request,response.clone()).catch(()=>{}));
      }
      return response;
    }catch{
      const cached=await caches.match(request);
      if(cached)return cached;
      if(request.mode==='navigate')return (await caches.match('./index.html'))||new Response(
        'التطبيق غير متاح بدون اتصال. افتح الموقع مرة واحدة مع الإنترنت.',
        {status:503,headers:{'Content-Type':'text/plain; charset=utf-8'}}
      );
      return new Response('',{status:504,statusText:'Offline'});
    }
  })());
});
