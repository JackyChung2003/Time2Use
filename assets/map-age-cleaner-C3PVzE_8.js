import{c as s}from"./@supabase-C8qbL7oB.js";import{p as w}from"./p-defer-O4M1dHHK.js";var p={exports:{}};(function(_,v){var x=s&&s.__awaiter||function(t,c,i,n){return new(i||(i=Promise))(function(r,u){function l(e){try{o(n.next(e))}catch(f){u(f)}}function a(e){try{o(n.throw(e))}catch(f){u(f)}}function o(e){e.done?r(e.value):new i(function(f){f(e.value)}).then(l,a)}o((n=n.apply(t,c||[])).next())})},h=s&&s.__importDefault||function(t){return t&&t.__esModule?t:{default:t}};Object.defineProperty(v,"__esModule",{value:!0});const y=h(w);function d(t,c="maxAge"){let i,n,r;const u=()=>x(this,void 0,void 0,function*(){if(i!==void 0)return;const o=e=>x(this,void 0,void 0,function*(){r=y.default();const f=e[1][c]-Date.now();if(f<=0){t.delete(e[0]),r.resolve();return}return i=e[0],n=setTimeout(()=>{t.delete(e[0]),r&&r.resolve()},f),typeof n.unref=="function"&&n.unref(),r.promise});try{for(const e of t)yield o(e)}catch{}i=void 0}),l=()=>{i=void 0,n!==void 0&&(clearTimeout(n),n=void 0),r!==void 0&&(r.reject(void 0),r=void 0)},a=t.set.bind(t);return t.set=(o,e)=>{t.has(o)&&t.delete(o);const f=a(o,e);return i&&i===o&&l(),u(),f},u(),t}v.default=d,_.exports=d,_.exports.default=d})(p,p.exports);var b=p.exports;export{b as d};
