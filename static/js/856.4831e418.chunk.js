"use strict";(self.webpackChunkweaco=self.webpackChunkweaco||[]).push([[856],{1856:function(e,n,t){t.r(n),t.d(n,{default:function(){return x}});var a=t(5861),r=t(7757),s=t.n(r),o=t(1969),c=t(9439),u=t(1095),i=t(7313),l=t(5964),h=t(6417),m=function(){var e=(0,i.useState)(""),n=(0,c.Z)(e,2),t=n[0],r=n[1],o=(0,i.useState)(""),m=(0,c.Z)(o,2),p=m[0],d=m[1],x=(0,i.useState)(!0),f=(0,c.Z)(x,2),v=f[0],g=f[1],j=(0,i.useState)(""),k=(0,c.Z)(j,2),w=k[0],b=k[1],N=function(e){var n=e.target,t=n.name,a=n.value;"email"===t?r(a):"password"===t&&d(a)},C=function(){var e=(0,a.Z)(s().mark((function e(n){return s().wrap((function(e){for(;;)switch(e.prev=e.next){case 0:if(n.preventDefault(),e.prev=1,!v){e.next=7;break}return e.next=5,u.ON.createUserWithEmailAndPassword(t,p);case 5:e.next=9;break;case 7:return e.next=9,u.ON.signInWithEmailAndPassword(t,p);case 9:e.next=14;break;case 11:e.prev=11,e.t0=e.catch(1),b(e.t0.message.split(":")[1]);case 14:case"end":return e.stop()}}),e,null,[[1,11]])})));return function(n){return e.apply(this,arguments)}}();return(0,h.jsxs)(h.Fragment,{children:[(0,h.jsxs)(l.ql,{children:[(0,h.jsx)("title",{children:"\ub85c\uadf8\uc778/\ud68c\uc6d0\uac00\uc785 - Weaco"}),(0,h.jsx)("meta",{property:"og:title",content:"\ub85c\uadf8\uc778/\ud68c\uc6d0\uac00\uc785"}),(0,h.jsx)("meta",{name:"og:url",content:"https://weaco.co.kr/login"})]}),(0,h.jsxs)("form",{onSubmit:C,className:"container",children:[(0,h.jsx)("input",{name:"email",type:"email",placeholder:"Email",required:!0,value:t,onChange:N,className:"authInput"}),(0,h.jsx)("input",{name:"password",type:"password",placeholder:"Password",required:!0,value:p,onChange:N,className:"authInput"}),(0,h.jsx)("input",{type:"submit",value:v?"\ud68c\uc6d0\uac00\uc785":"\ub85c\uadf8\uc778",className:"commonBtn authInput authSubmit"}),w&&(0,h.jsx)("span",{className:"authError",children:w})]}),(0,h.jsx)("span",{onClick:function(){return g((function(e){return!e}))},className:"authSwitch",children:v?"\ub85c\uadf8\uc778":"\ud68c\uc6d0\uac00\uc785"})]})},p=t(4243),d=t(7890),x=function(e){var n=e.isLoggedIn,t=(0,d.s0)();n&&t("/");var r=function(){var e=(0,a.Z)(s().mark((function e(n){var t,a;return s().wrap((function(e){for(;;)switch(e.prev=e.next){case 0:return"google"===(t=n.target.name)?a=new u.lG.auth.GoogleAuthProvider:"facebook"===t&&(a=new u.lG.auth.FacebookAuthProvider),e.next=4,u.ON.signInWithPopup(a);case 4:case"end":return e.stop()}}),e)})));return function(n){return e.apply(this,arguments)}}();return(0,h.jsx)("section",{className:"wrapContainer dark",children:(0,h.jsxs)("div",{className:"authContainer dark",children:[(0,h.jsx)(m,{}),(0,h.jsxs)("div",{className:"authBtns",children:[(0,h.jsxs)("button",{onClick:r,name:"google",className:"commonBtn authBtn",children:["Google ",(0,h.jsx)(o.G,{icon:p.xYR})]}),(0,h.jsxs)("button",{onClick:r,name:"facebook",className:"commonBtn authBtn",children:["Facebook ",(0,h.jsx)(o.G,{icon:p.neY})]})]})]})})}}}]);