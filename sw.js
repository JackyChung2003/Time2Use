if(!self.define){let e,i={};const s=(s,n)=>(s=new URL(s+".js",n).href,i[s]||new Promise((i=>{if("document"in self){const e=document.createElement("script");e.src=s,e.onload=i,document.head.appendChild(e)}else e=s,importScripts(s),i()})).then((()=>{let e=i[s];if(!e)throw new Error(`Module ${s} didn’t register its module`);return e})));self.define=(n,r)=>{const o=e||("document"in self?document.currentScript.src:"")||location.href;if(i[o])return;let t={};const d=e=>s(e,o),c={module:{uri:o},exports:t,require:d};i[o]=Promise.all(n.map((e=>c[e]||d(e)))).then((e=>(r(...e),t)))}}define(["./workbox-5ffe50d4"],(function(e){"use strict";self.skipWaiting(),e.clientsClaim(),e.precacheAndRoute([{url:"assets/browser-BKoZjBHM.js",revision:null},{url:"assets/index-bhDjU1B5.js",revision:null},{url:"assets/index-ChWAOdN4.css",revision:null},{url:"index.html",revision:"c925cd8302100a29407cf351838677d2"},{url:"registerSW.js",revision:"04a9c3f5a52ed27fdc1b2fd5e9bc0bcc"},{url:"icon-192x192.png",revision:"265f42e6870ab0294b5f461ddcfdb9fa"},{url:"icon-512x512.png",revision:"b812dfff96419989c127fee23e87634e"},{url:"maskable-icon-512x512.png",revision:"d46c22825cebed49859329714194ea18"},{url:"manifest.webmanifest",revision:"f2d9eed4bacd01ff4a026aee39ad0d42"}],{}),e.cleanupOutdatedCaches(),e.registerRoute(new e.NavigationRoute(e.createHandlerBoundToURL("index.html")))}));
