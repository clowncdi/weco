"use strict";(self.webpackChunkweaco=self.webpackChunkweaco||[]).push([[589],{6008:function(t,e,a){var n=a(9439),s=a(2791),i=a(184);e.Z=function(t){var e=t.text,a=(0,s.useState)(""),r=(0,n.Z)(a,2),c=r[0],d=r[1],l=(0,s.useState)(""),o=(0,n.Z)(l,2),u=o[0],p=o[1],m=(0,s.useState)(""),h=(0,n.Z)(m,2),x=h[0],j=h[1],f=(0,s.useState)(""),_=(0,n.Z)(f,2),v=_[0],y=_[1],w=(0,s.useState)(""),g=(0,n.Z)(w,2),k=g[0],N=g[1],b=(0,s.useState)(""),S=(0,n.Z)(b,2),Z=S[0],A=S[1],C=(0,s.useState)(""),E=(0,n.Z)(C,2),O=E[0],I=E[1];(0,s.useEffect)((function(){var t=e.indexOf("<br>S"),a=e.indexOf("\uc6d0</p>"),n=e.slice(t+4,a+1);d(T(n,"S&amp;P500")),p(T(n,"\ub2e4\uc6b0")),j(T(n,"\ub098\uc2a4\ub2e5")),y(T(n,"WTI")),N(T(n,"\ub2ec\ub7ec\uc778\ub371\uc2a4")),A(T(n,"VIX")),I(T(n,"\uae08"))}),[]);var T=function(t,e){var a=t.indexOf(e),n=t.indexOf("),",a);return t.slice(a+e.length,n)},U=c.split("("),q=u.split("("),D=x.split("("),F=v.split("("),B=k.split("("),H=Z.split("("),W=O.split("(");return(0,i.jsxs)(i.Fragment,{children:[(0,i.jsxs)("div",{className:c.indexOf("-")>0?"minus":"",children:[(0,i.jsx)("h3",{children:"S&P500"}),(0,i.jsx)("span",{children:U[0]}),(0,i.jsx)("span",{children:U[1]})]}),(0,i.jsxs)("div",{className:u.indexOf("-")>0?"minus":"",children:[(0,i.jsx)("h3",{children:"\ub2e4\uc6b0"}),(0,i.jsx)("span",{children:q[0]}),(0,i.jsx)("span",{children:q[1]})]}),(0,i.jsxs)("div",{className:x.indexOf("-")>0?"minus":"",children:[(0,i.jsx)("h3",{children:"\ub098\uc2a4\ub2e5"}),(0,i.jsx)("span",{children:D[0]}),(0,i.jsx)("span",{children:D[1]})]}),(0,i.jsxs)("div",{className:v.indexOf("-")>0?"minus":"",children:[(0,i.jsx)("h3",{children:"WTI"}),(0,i.jsx)("span",{children:F[0]}),(0,i.jsx)("span",{children:F[1]})]}),(0,i.jsxs)("div",{className:k.indexOf("-")>0?"minus":"",children:[(0,i.jsx)("h3",{children:"\ub2ec\ub7ec\uc778\ub371\uc2a4"}),(0,i.jsx)("span",{children:B[0]}),(0,i.jsx)("span",{children:B[1]})]}),(0,i.jsxs)("div",{className:Z.indexOf("-")>0?"minus":"",children:[(0,i.jsx)("h3",{children:"VIX"}),(0,i.jsx)("span",{children:H[0]}),(0,i.jsx)("span",{children:H[1]})]}),(0,i.jsxs)("div",{className:O.indexOf("-")>0?"minus":"",children:[(0,i.jsx)("h3",{children:"\uae08"}),(0,i.jsx)("span",{children:W[0].replaceAll(",","")}),(0,i.jsx)("span",{children:W[1]})]})]})}},8964:function(t,e,a){var n=a(9439),s=a(2791),i=a(184);e.Z=function(){var t=(0,s.useState)(!0),e=(0,n.Z)(t,2),a=e[0],r=e[1],c=(0,s.useState)([]),d=(0,n.Z)(c,2),l=d[0],o=d[1];return(0,s.useEffect)((function(){fetch("https://api.upbit.com/v1/ticker?markets=KRW-BTC").then((function(t){return t.json()})).then((function(t){o(t),r(!1)}))}),[]),(0,i.jsxs)("div",{className:"indicatorWrap",children:[(0,i.jsx)("h3",{children:"\ube44\ud2b8\ucf54\uc778"}),a?(0,i.jsx)("strong",{children:"Loading..."}):(0,i.jsx)(i.Fragment,{children:l.map((function(t){return(0,i.jsxs)("span",{children:[t.trade_price.toString().replace(/\B(?=(\d{3})+(?!\d))/g,","),"\uc6d0"]},t.market)}))})]})}},2562:function(t,e,a){function n(){var t=document.createElement("ins"),e=document.createElement("script");t.className="kakao_ad_area",t.style="display:none;",e.async="true",e.type="text/javascript",e.src="//t1.daumcdn.net/kas/static/ba.min.js",t.setAttribute("data-ad-width","728"),t.setAttribute("data-ad-height","90"),t.setAttribute("data-ad-unit","DAN-tKU4yHX8dMgPKwCZ"),document.querySelector(".adfit-l").appendChild(t),document.querySelector(".adfit-l").appendChild(e)}function s(){var t=document.createElement("ins"),e=document.createElement("script");t.className="kakao_ad_area",t.style="display:none;",e.async="true",e.type="text/javascript",e.src="//t1.daumcdn.net/kas/static/ba.min.js",t.setAttribute("data-ad-width","728"),t.setAttribute("data-ad-height","90"),t.setAttribute("data-ad-unit","DAN-jGiMQ6EH86M8F9Es"),document.querySelector(".adfit-l2").appendChild(t),document.querySelector(".adfit-l2").appendChild(e)}function i(){var t=document.createElement("ins"),e=document.createElement("script");t.className="kakao_ad_area",t.style="display:none;",e.async="true",e.type="text/javascript",e.src="//t1.daumcdn.net/kas/static/ba.min.js",t.setAttribute("data-ad-width","300"),t.setAttribute("data-ad-height","250"),t.setAttribute("data-ad-unit","DAN-Hcu5nHPeZnLkt3BD"),document.querySelector(".adfit-m").appendChild(t),document.querySelector(".adfit-m").appendChild(e)}function r(){var t=document.createElement("ins"),e=document.createElement("script");t.className="kakao_ad_area",t.style="display:none;",e.async="true",e.type="text/javascript",e.src="//t1.daumcdn.net/kas/static/ba.min.js",t.setAttribute("data-ad-width","320"),t.setAttribute("data-ad-height","100"),t.setAttribute("data-ad-unit","DAN-4IfNudyvoRODLhUE"),document.querySelector(".adfit-m2").appendChild(t),document.querySelector(".adfit-m2").appendChild(e)}a.d(e,{y6:function(){return n},wY:function(){return s},kj:function(){return i},ev:function(){return r}})},7589:function(t,e,a){a.r(e),a.d(e,{default:function(){return f}});var n=a(5861),s=a(9439),i=a(7757),r=a.n(i),c=a(1248),d=a(2791),l=a(6907),o=a(3504),u=a(6871),p=a(6008),m=a(8964),h=a(2562),x=a(184),j=function(t){var e=t.userObj,a=t.itemId,i=(0,u.s0)(),j=(0,d.useState)(""),f=(0,s.Z)(j,2),_=f[0],v=f[1],y=(0,d.useState)(""),w=(0,s.Z)(y,2),g=w[0],k=w[1],N=(0,d.useState)(""),b=(0,s.Z)(N,2),S=b[0],Z=b[1],A=(0,d.useState)(""),C=(0,s.Z)(A,2),E=C[0],O=C[1],I=(0,d.useState)(""),T=(0,s.Z)(I,2),U=T[0],q=T[1],D=(0,d.useState)([]),F=(0,s.Z)(D,2),B=F[0],H=F[1],W=(0,d.useState)(""),L=(0,s.Z)(W,2),K=L[0],R=L[1],M=(0,d.useState)(""),P=(0,s.Z)(M,2),z=P[0],X=P[1],G=(0,d.useState)(""),V=(0,s.Z)(G,2),Y=V[0],Q=V[1],J=(0,d.useState)(""),$=(0,s.Z)(J,2),tt=$[0],et=$[1],at=(0,d.useState)(!1),nt=(0,s.Z)(at,2),st=nt[0],it=nt[1];(0,d.useEffect)((function(){var t=0;c.wO.doc("items/".concat(a)).get().then((function(a){var n=a.data(),s=n.text.split("</p><p>").map((function(e){return(0,x.jsx)("p",{className:"detail__text",children:e.replace("<p>","").replace("</p>","").replace("&amp;","&").replace("&nbsp;","").split("<br>").map((function(e){return t+=1,(0,x.jsx)("span",{children:e},t)}))},t+1)}));s[0].props.children[0].props.children.includes("\ub0a0\uc528\uc640 \uacbd\uc81c")&&s[0].props.children.shift(),s[1]&&s[1].props.children.pop(),s.pop(),v(n.title),q(s),k(n.date),Z(n.lowestTemp),O(n.highestTemp),H(n.tags),R(n.attachmentUrl),X(n.thumbnailUrl),Q(n),e&&it(n.creatorId===e.uid);var i=Number(n.lowestTemp)+Number(n.highestTemp);""===i?et("temp__none"):i<=-20?et("temp__cold20"):i<=-10&&i>-20?et("temp__cold10"):i<8&&i>-10?et("temp__cold2"):i>=8&&i<15?et("temp__spring"):i>=15&&i<30?et("temp__hot15"):i>=30&&i<40?et("temp__hot30"):i>=40&&i<50?et("temp__hot40"):i>=50&&et("temp__hot50")}))}),[]);var rt=["\uc624\ub298\uc758\ub0a0\uc528","\uc624\ub298\uc758\uacbd\uc81c","\ub0a0\uc528","\uacbd\uc81c","\ub274\uc2a4","\uc624\ub298\ub0a0\uc528","\uc11c\uc6b8\ub0a0\uc528","\uc2dc\ud669","\uc8fc\uc2dd","\ucf54\uc778","\uacbd\uc81c\ub274\uc2a4","\ubbf8\uad6d\uc99d\uc2dc","\ub274\uc695\uc99d\uc2dc"];(0,d.useEffect)((function(){ct()}),[]);var ct=function(){var t=window.Kakao;t.isInitialized()||t.init("a23aecf2262cfcdbc60619d8c356f926")},dt=B.filter((function(t){return!rt.includes(t)})),lt=function(){var t=(0,n.Z)(r().mark((function t(){return r().wrap((function(t){for(;;)switch(t.prev=t.next){case 0:if(!window.confirm("\uc0ad\uc81c\ud558\uc2dc\uaca0\uc2b5\ub2c8\uae4c?")){t.next=10;break}return t.next=4,c.wO.doc("items/".concat(a)).delete();case 4:return t.next=6,c.Hw.refFromURL(Y.attachmentUrl).delete();case 6:return t.next=8,c.Hw.refFromURL(Y.thumbnailUrl).delete();case 8:alert("\uc0ad\uc81c \uc644\ub8cc!"),i("/");case 10:case"end":return t.stop()}}),t)})));return function(){return t.apply(this,arguments)}}(),ot="https://weaco.co.kr/"+{itemId:a};return(0,d.useEffect)((function(){(0,h.wY)(),(0,h.kj)()}),[]),(0,x.jsx)(x.Fragment,{children:(0,x.jsxs)("div",{className:"factoryForm",children:[(0,x.jsxs)(l.ql,{children:[(0,x.jsxs)("title",{children:[g," \uc624\ub298\uc758 \ub0a0\uc528\uc640 \uacbd\uc81c - Weaco"]}),(0,x.jsx)("meta",{name:"keywords",content:B}),(0,x.jsx)("meta",{property:"og:type",content:"website"}),(0,x.jsx)("meta",{property:"og:site_name",content:"\uc624\ub298\uc758 \ub0a0\uc528\uc640 \uacbd\uc81c - Weaco"}),(0,x.jsx)("meta",{property:"og:title",content:_}),(0,x.jsx)("meta",{property:"og:description",content:"\uac04\ub2e8\ud55c \ub0a0\uc528 \uc815\ubcf4\uc640 \uacbd\uc81c \uc18c\uc2dd\uc744 \uc54c\ub824\ub4dc\ub9bd\ub2c8\ub2e4."}),(0,x.jsx)("meta",{property:"og:image",content:K}),(0,x.jsx)("meta",{property:"og:url",content:ot}),(0,x.jsx)("meta",{property:"twitter:card",content:"summary"}),(0,x.jsx)("meta",{property:"twitter:site",content:"\uc624\ub298\uc758 \ub0a0\uc528\uc640 \uacbd\uc81c - Weaco"}),(0,x.jsx)("meta",{property:"twitter:title",content:_}),(0,x.jsx)("meta",{property:"twitter:description",content:"\uac04\ub2e8\ud55c \ub0a0\uc528 \uc815\ubcf4\uc640 \uacbd\uc81c \uc18c\uc2dd\uc744 \uc54c\ub824\ub4dc\ub9bd\ub2c8\ub2e4."}),(0,x.jsx)("meta",{property:"twitter:image",content:K}),(0,x.jsx)("meta",{property:"twitter:url",content:ot})]}),(0,x.jsxs)("div",{className:"factoryInput__container",children:[Y&&(0,x.jsxs)(x.Fragment,{children:[(0,x.jsxs)("div",{className:"detail__top",children:[(0,x.jsx)("h1",{children:_}),(0,x.jsx)("h2",{className:"item__date",children:g}),(0,x.jsxs)("div",{className:"item__temperature ".concat(tt),children:[(0,x.jsxs)("span",{children:["\ucd5c\uc800 ",S,"\xb0C"]}),(0,x.jsxs)("span",{children:["\ucd5c\uace0 ",E,"\xb0C"]})]}),(0,x.jsx)("div",{className:"detail__img",children:K&&(0,x.jsx)("img",{src:K,alt:_,width:"100%",loading:"lazy"})})]}),Y.text.indexOf("<br>S")>0&&(0,x.jsxs)("div",{className:"indicator-wrap",children:[(0,x.jsx)("div",{className:"indicator-arrow prev",children:"<"}),(0,x.jsx)("div",{className:"indicator-arrow next",children:">"}),(0,x.jsxs)("div",{className:"indicatorContainer itemDetail",children:[(0,x.jsx)(p.Z,{text:Y.text}),(0,x.jsx)(m.Z,{})]})]})]}),(0,x.jsx)("div",{className:"detail__content",children:U}),(0,x.jsx)("div",{className:"adfit adfit-l2"}),(0,x.jsx)("div",{className:"adfit adfit-m"}),(0,x.jsxs)("div",{className:"detail__tag",children:[(0,x.jsx)("h5",{children:"\uc624\ub298\uc758 \uc774\uc288"}),B.map((function(t){return!rt.includes(t)&&(0,x.jsx)(o.rU,{to:"/",state:{tagged:t},children:(0,x.jsx)("span",{className:"formBtn tagBtn commonBtn",children:t},t)})}))]}),(0,x.jsxs)("div",{className:"detail__btns",children:[(0,x.jsx)("label",{className:"factoryInput__arrow",onClick:function(){return i("/")},children:"\ubaa9\ub85d"}),(0,x.jsxs)("button",{id:"kakao-link-btn",className:"detail__btn__kakao",onClick:function(){window.Kakao.Share.createCustomButton({container:"#kakao-link-btn",templateId:81294,templateArgs:{TITLE:"".concat(_),DATE:"".concat(g),TAGS:"".concat(dt),THUMB:"".concat(z),ID:"".concat(a)}})},children:[(0,x.jsx)("img",{src:"/kakaotalk_sharing_btn_medium.png",width:"20px",style:{verticalAlign:"middle",marginRight:10},alt:"\uce74\uce74\uc624\ud1a1 \uacf5\uc720",loading:"lazy"}),"\uce74\ud1a1 \uacf5\uc720"]}),st&&(0,x.jsxs)(x.Fragment,{children:[(0,x.jsx)("span",{onClick:lt,className:"factoryInput__arrow topicEdit",children:"\uc0ad\uc81c"}),(0,x.jsx)(o.rU,{to:{pathname:"/write/".concat(a),state:{uid:Y.creatorId}},children:(0,x.jsx)("span",{className:"factoryInput__arrow topicEdit",children:"\uc218\uc815"})})]})]})]})]})})},f=function(t){var e=t.userObj,a=(0,u.UO)().id;return(0,x.jsx)("section",{className:"wrapContainer dark",children:(0,x.jsx)("div",{className:"container",children:(0,x.jsx)(j,{userObj:e,itemId:a})})})}}}]);
//# sourceMappingURL=589.a98976dd.chunk.js.map