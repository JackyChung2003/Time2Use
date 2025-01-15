import{k as M,g as C,e as b,c as y}from"./@babel-DIaYKQuy.js";import{r as a,a as Ye}from"./react-Ck4LUVBC.js";import{c as ie}from"./classnames-BbTGAWaK.js";import{R as Ce}from"./rc-resize-observer-B5ylZEVs.js";import{x as qe,j as Je,u as Qe}from"./rc-util-C0LYQZ5Y.js";import{r as Ze}from"./react-dom-Ds7J2zyt.js";var et=["prefixCls","invalidate","item","renderItem","responsive","responsiveDisabled","registerSize","itemKey","className","style","children","display","order","component"],I=void 0;function tt(e,s){var o=e.prefixCls,f=e.invalidate,l=e.item,n=e.renderItem,u=e.responsive,S=e.responsiveDisabled,m=e.registerSize,N=e.itemKey,p=e.className,H=e.style,Y=e.children,q=e.display,d=e.order,K=e.component,O=K===void 0?"div":K,z=M(e,et),v=u&&!q;function k(E){m(N,E)}a.useEffect(function(){return function(){k(null)}},[]);var J=n&&l!==I?n(l,{index:d}):Y,w;f||(w={opacity:v?0:1,height:v?0:I,overflowY:v?"hidden":I,order:u?d:I,pointerEvents:v?"none":I,position:v?"absolute":I});var $={};v&&($["aria-hidden"]=!0);var h=a.createElement(O,C({className:ie(!f&&o,p),style:b(b({},w),H)},$,z,{ref:s}),J);return u&&(h=a.createElement(Ce,{onResize:function(Q){var V=Q.offsetWidth;k(V)},disabled:S},h)),h}var A=a.forwardRef(tt);A.displayName="Item";function rt(e){if(typeof MessageChannel>"u")qe(e);else{var s=new MessageChannel;s.port1.onmessage=function(){return e()},s.port2.postMessage(void 0)}}function at(){var e=a.useRef(null),s=function(f){e.current||(e.current=[],rt(function(){Ze.unstable_batchedUpdates(function(){e.current.forEach(function(l){l()}),e.current=null})})),e.current.push(f)};return s}function W(e,s){var o=a.useState(s),f=y(o,2),l=f[0],n=f[1],u=Je(function(S){e(function(){n(S)})});return[l,u]}var X=Ye.createContext(null),nt=["component"],it=["className"],st=["className"],ft=function(s,o){var f=a.useContext(X);if(!f){var l=s.component,n=l===void 0?"div":l,u=M(s,nt);return a.createElement(n,C({},u,{ref:o}))}var S=f.className,m=M(f,it),N=s.className,p=M(s,st);return a.createElement(X.Provider,{value:null},a.createElement(A,C({ref:o,className:ie(S,N)},m,p)))},Ne=a.forwardRef(ft);Ne.displayName="RawItem";var lt=["prefixCls","data","renderItem","renderRawItem","itemKey","itemWidth","ssr","style","className","maxCount","renderRest","renderRawRest","suffix","component","itemComponent","onVisibleChange"],pe="responsive",we="invalidate";function ot(e){return"+ ".concat(e.length," ...")}function ut(e,s){var o=e.prefixCls,f=o===void 0?"rc-overflow":o,l=e.data,n=l===void 0?[]:l,u=e.renderItem,S=e.renderRawItem,m=e.itemKey,N=e.itemWidth,p=N===void 0?10:N,H=e.ssr,Y=e.style,q=e.className,d=e.maxCount,K=e.renderRest,O=e.renderRawRest,z=e.suffix,v=e.component,k=v===void 0?"div":v,J=e.itemComponent,w=e.onVisibleChange,$=M(e,lt),h=H==="full",E=at(),Q=W(E,null),V=y(Q,2),U=V[0],xe=V[1],_=U||0,Ie=W(E,new Map),se=y(Ie,2),fe=se[0],be=se[1],ze=W(E,0),le=y(ze,2),Pe=le[0],De=le[1],We=W(E,0),oe=y(We,2),F=oe[0],Me=oe[1],Ae=W(E,0),ue=y(Ae,2),T=ue[0],Ke=ue[1],Oe=a.useState(null),de=y(Oe,2),Z=de[0],ce=de[1],ke=a.useState(null),me=y(ke,2),j=me[0],$e=me[1],x=a.useMemo(function(){return j===null&&h?Number.MAX_SAFE_INTEGER:j||0},[j,U]),Ve=a.useState(!1),ve=y(Ve,2),Ue=ve[0],Fe=ve[1],ee="".concat(f,"-item"),Re=Math.max(Pe,F),te=d===pe,R=n.length&&te,ye=d===we,Te=R||typeof d=="number"&&n.length>d,g=a.useMemo(function(){var t=n;return R?U===null&&h?t=n:t=n.slice(0,Math.min(n.length,_/p)):typeof d=="number"&&(t=n.slice(0,d)),t},[n,p,U,d,R]),re=a.useMemo(function(){return R?n.slice(x+1):n.slice(g.length)},[n,g,R,x]),L=a.useCallback(function(t,r){var i;return typeof m=="function"?m(t):(i=m&&(t==null?void 0:t[m]))!==null&&i!==void 0?i:r},[m]),je=a.useCallback(u||function(t){return t},[u]);function G(t,r,i){j===t&&(r===void 0||r===Z)||($e(t),i||(Fe(t<n.length-1),w==null||w(t)),r!==void 0&&ce(r))}function Le(t,r){xe(r.clientWidth)}function Se(t,r){be(function(i){var c=new Map(i);return r===null?c.delete(t):c.set(t,r),c})}function Ge(t,r){Me(r),De(F)}function Xe(t,r){Ke(r)}function ae(t){return fe.get(L(g[t],t))}Qe(function(){if(_&&typeof Re=="number"&&g){var t=T,r=g.length,i=r-1;if(!r){G(0,null);return}for(var c=0;c<r;c+=1){var D=ae(c);if(h&&(D=D||0),D===void 0){G(c-1,void 0,!0);break}if(t+=D,i===0&&t<=_||c===i-1&&t+ae(i)<=_){G(i,null);break}else if(t+Re>_){G(c-1,t-D-T+F);break}}z&&ae(0)+T>_&&ce(null)}},[_,fe,F,T,L,g]);var Ee=Ue&&!!re.length,he={};Z!==null&&R&&(he={position:"absolute",left:Z,top:0});var P={prefixCls:ee,responsive:R,component:J,invalidate:ye},Be=S?function(t,r){var i=L(t,r);return a.createElement(X.Provider,{key:i,value:b(b({},P),{},{order:r,item:t,itemKey:i,registerSize:Se,display:r<=x})},S(t,r))}:function(t,r){var i=L(t,r);return a.createElement(A,C({},P,{order:r,key:i,item:t,renderItem:je,itemKey:i,registerSize:Se,display:r<=x}))},_e={order:Ee?x:Number.MAX_SAFE_INTEGER,className:"".concat(ee,"-rest"),registerSize:Ge,display:Ee},ne=K||ot,He=O?a.createElement(X.Provider,{value:b(b({},P),_e)},O(re)):a.createElement(A,C({},P,_e),typeof ne=="function"?ne(re):ne),ge=a.createElement(k,C({className:ie(!ye&&f,q),style:Y,ref:s},$),g.map(Be),Te?He:null,z&&a.createElement(A,C({},P,{responsive:te,responsiveDisabled:!R,order:x,className:"".concat(ee,"-suffix"),registerSize:Xe,display:!0,style:he}),z));return te?a.createElement(Ce,{onResize:Le,disabled:!R},ge):ge}var B=a.forwardRef(ut);B.displayName="Overflow";B.Item=Ne;B.RESPONSIVE=pe;B.INVALIDATE=we;export{B as F};
