import{c as f}from"./ccount-c2V3InAJ.js";import{o as k}from"./devlop-Cl3hj7Sz.js";import{u as p,a as d}from"./micromark-util-character-Cn8n62xE.js";import{f as g}from"./mdast-util-find-and-replace-Cmrefh_I.js";const o="phrasing",s=["autolink","link","image","label"];function b(){return{transforms:[y],enter:{literalAutolink:w,literalAutolinkEmail:u,literalAutolinkHttp:u,literalAutolinkWww:u},exit:{literalAutolink:L,literalAutolinkEmail:m,literalAutolinkHttp:x,literalAutolinkWww:A}}}function I(){return{unsafe:[{character:"@",before:"[+\\-.\\w]",after:"[\\-.\\w]",inConstruct:o,notInConstruct:s},{character:".",before:"[Ww]",after:"[\\-.\\w]",inConstruct:o,notInConstruct:s},{character:":",before:"[ps]",after:"\\/",inConstruct:o,notInConstruct:s}]}}function w(t){this.enter({type:"link",title:null,url:"",children:[]},t)}function u(t){this.config.enter.autolinkProtocol.call(this,t)}function x(t){this.config.exit.autolinkProtocol.call(this,t)}function A(t){this.config.exit.data.call(this,t);const e=this.stack[this.stack.length-1];k(e.type==="link"),e.url="http://"+this.sliceSerialize(t)}function m(t){this.config.exit.autolinkEmail.call(this,t)}function L(t){this.exit(t)}function y(t){g(t,[[/(https?:\/\/|www(?=\.))([-.\w]+)([^ \t\r\n]*)/gi,P],[new RegExp("(?<=^|\\s|\\p{P}|\\p{S})([-.\\w+]+)@([-\\w]+(?:\\.[-\\w]+)+)","gu"),E]],{ignore:["link","linkReference"]})}function P(t,e,i,n,a){let l="";if(!h(a)||(/^w/i.test(e)&&(i=e+i,e="",l="http://"),!W(i)))return!1;const r=_(i+n);if(!r[0])return!1;const c={type:"link",title:null,url:l+e+r[0],children:[{type:"text",value:e+r[0]}]};return r[1]?[c,{type:"text",value:r[1]}]:c}function E(t,e,i,n){return!h(n,!0)||/[-\d_]$/.test(i)?!1:{type:"link",title:null,url:"mailto:"+e+"@"+i,children:[{type:"text",value:e+"@"+i}]}}function W(t){const e=t.split(".");return!(e.length<2||e[e.length-1]&&(/_/.test(e[e.length-1])||!/[a-zA-Z\d]/.test(e[e.length-1]))||e[e.length-2]&&(/_/.test(e[e.length-2])||!/[a-zA-Z\d]/.test(e[e.length-2])))}function _(t){const e=/[!"&'),.:;<>?\]}]+$/.exec(t);if(!e)return[t,void 0];t=t.slice(0,e.index);let i=e[0],n=i.indexOf(")");const a=f(t,"(");let l=f(t,")");for(;n!==-1&&a>l;)t+=i.slice(0,n+1),i=i.slice(n+1),n=i.indexOf(")"),l++;return[t,i]}function h(t,e){const i=t.input.charCodeAt(t.index-1);return(t.index===0||p(i)||d(i))&&(!e||i!==47)}export{I as a,b as g};
