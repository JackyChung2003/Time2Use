import{r as i}from"./react-Ck4LUVBC.js";/*! *****************************************************************************
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the Apache License, Version 2.0 (the "License"); you may not use
this file except in compliance with the License. You may obtain a copy of the
License at http://www.apache.org/licenses/LICENSE-2.0

THIS CODE IS PROVIDED ON AN *AS IS* BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
KIND, EITHER EXPRESS OR IMPLIED, INCLUDING WITHOUT LIMITATION ANY IMPLIED
WARRANTIES OR CONDITIONS OF TITLE, FITNESS FOR A PARTICULAR PURPOSE,
MERCHANTABLITY OR NON-INFRINGEMENT.

See the Apache Version 2.0 License for specific language governing permissions
and limitations under the License.
***************************************************************************** */var u=function(a,r){return u=Object.setPrototypeOf||{__proto__:[]}instanceof Array&&function(t,e){t.__proto__=e}||function(t,e){for(var s in e)e.hasOwnProperty(s)&&(t[s]=e[s])},u(a,r)};function y(a,r){u(a,r);function t(){this.constructor=a}a.prototype=r===null?Object.create(r):(t.prototype=r.prototype,new t)}var f=100,v=100,k=50,l=50,h=50;function m(a){var r=a.className,t=a.counterClockwise,e=a.dashRatio,s=a.pathRadius,o=a.strokeWidth,n=a.style;return i.createElement("path",{className:r,style:Object.assign({},n,x({pathRadius:s,dashRatio:e,counterClockwise:t})),d:C({pathRadius:s,counterClockwise:t}),strokeWidth:o,fillOpacity:0})}function C(a){var r=a.pathRadius,t=a.counterClockwise,e=r,s=t?1:0;return`
      M `+l+","+h+`
      m 0,-`+e+`
      a `+e+","+e+" "+s+" 1 1 0,"+2*e+`
      a `+e+","+e+" "+s+" 1 1 0,-"+2*e+`
    `}function x(a){var r=a.counterClockwise,t=a.dashRatio,e=a.pathRadius,s=Math.PI*2*e,o=(1-t)*s;return{strokeDasharray:s+"px "+s+"px",strokeDashoffset:(r?-o:o)+"px"}}(function(a){y(r,a);function r(){return a!==null&&a.apply(this,arguments)||this}return r.prototype.getBackgroundPadding=function(){return this.props.background?this.props.backgroundPadding:0},r.prototype.getPathRadius=function(){return k-this.props.strokeWidth/2-this.getBackgroundPadding()},r.prototype.getPathRatio=function(){var t=this.props,e=t.value,s=t.minValue,o=t.maxValue,n=Math.min(Math.max(e,s),o);return(n-s)/(o-s)},r.prototype.render=function(){var t=this.props,e=t.circleRatio,s=t.className,o=t.classes,n=t.counterClockwise,c=t.styles,d=t.strokeWidth,p=t.text,g=this.getPathRadius(),R=this.getPathRatio();return i.createElement("svg",{className:o.root+" "+s,style:c.root,viewBox:"0 0 "+f+" "+v,"data-test-id":"CircularProgressbar"},this.props.background?i.createElement("circle",{className:o.background,style:c.background,cx:l,cy:h,r:k}):null,i.createElement(m,{className:o.trail,counterClockwise:n,dashRatio:e,pathRadius:g,strokeWidth:d,style:c.trail}),i.createElement(m,{className:o.path,counterClockwise:n,dashRatio:R*e,pathRadius:g,strokeWidth:d,style:c.path}),p?i.createElement("text",{className:o.text,style:c.text,x:l,y:h},p):null)},r.defaultProps={background:!1,backgroundPadding:0,circleRatio:1,classes:{root:"CircularProgressbar",trail:"CircularProgressbar-trail",path:"CircularProgressbar-path",text:"CircularProgressbar-text",background:"CircularProgressbar-background"},counterClockwise:!1,className:"",maxValue:100,minValue:0,strokeWidth:8,styles:{root:{},trail:{},path:{},text:{},background:{}},text:""},r})(i.Component);
