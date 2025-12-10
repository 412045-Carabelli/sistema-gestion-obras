import{L,O as M,u as y}from"./chunk-G4GGURKU.js";import{A as b,D as l,I,b as k,d as r,k as D,w as a,z as w}from"./chunk-5GYOOLE2.js";import{Q as p,R as d,W as o,Yb as g,Za as h,_a as u,ab as f,da as c,ka as m,yc as v}from"./chunk-HE3ZW6WA.js";var F=({dt:i})=>`
/* For PrimeNG */
.p-ripple {
    overflow: hidden;
    position: relative;
}

.p-ink {
    display: block;
    position: absolute;
    background: ${i("ripple.background")};
    border-radius: 100%;
    transform: scale(0);
}

.p-ink-active {
    animation: ripple 0.4s linear;
}

.p-ripple-disabled .p-ink {
    display: none !important;
}

@keyframes ripple {
    100% {
        opacity: 0;
        transform: scale(2.5);
    }
}
`,O={root:"p-ink"},x=(()=>{class i extends L{name="ripple";theme=F;classes=O;static \u0275fac=(()=>{let e;return function(s){return(e||(e=c(i)))(s||i)}})();static \u0275prov=p({token:i,factory:i.\u0275fac})}return i})();var z=(()=>{class i extends M{zone=o(m);_componentStyle=o(x);animationListener;mouseDownListener;timeout;constructor(){super(),v(()=>{y(this.platformId)&&(this.config.ripple()?this.zone.runOutsideAngular(()=>{this.create(),this.mouseDownListener=this.renderer.listen(this.el.nativeElement,"mousedown",this.onMouseDown.bind(this))}):this.remove())})}ngAfterViewInit(){super.ngAfterViewInit()}onMouseDown(e){let t=this.getInk();if(!t||this.document.defaultView?.getComputedStyle(t,null).display==="none")return;if(r(t,"p-ink-active"),!a(t)&&!l(t)){let n=Math.max(D(this.el.nativeElement),b(this.el.nativeElement));t.style.height=n+"px",t.style.width=n+"px"}let s=w(this.el.nativeElement),E=e.pageX-s.left+this.document.body.scrollTop-l(t)/2,A=e.pageY-s.top+this.document.body.scrollLeft-a(t)/2;this.renderer.setStyle(t,"top",A+"px"),this.renderer.setStyle(t,"left",E+"px"),k(t,"p-ink-active"),this.timeout=setTimeout(()=>{let n=this.getInk();n&&r(n,"p-ink-active")},401)}getInk(){let e=this.el.nativeElement.children;for(let t=0;t<e.length;t++)if(typeof e[t].className=="string"&&e[t].className.indexOf("p-ink")!==-1)return e[t];return null}resetInk(){let e=this.getInk();e&&r(e,"p-ink-active")}onAnimationEnd(e){this.timeout&&clearTimeout(this.timeout),r(e.currentTarget,"p-ink-active")}create(){let e=this.renderer.createElement("span");this.renderer.addClass(e,"p-ink"),this.renderer.appendChild(this.el.nativeElement,e),this.renderer.setAttribute(e,"aria-hidden","true"),this.renderer.setAttribute(e,"role","presentation"),this.animationListener||(this.animationListener=this.renderer.listen(e,"animationend",this.onAnimationEnd.bind(this)))}remove(){let e=this.getInk();e&&(this.mouseDownListener&&this.mouseDownListener(),this.animationListener&&this.animationListener(),this.mouseDownListener=null,this.animationListener=null,I(e))}ngOnDestroy(){this.config&&this.config.ripple()&&this.remove(),super.ngOnDestroy()}static \u0275fac=function(t){return new(t||i)};static \u0275dir=u({type:i,selectors:[["","pRipple",""]],hostAttrs:[1,"p-ripple"],features:[g([x]),f]})}return i})(),H=(()=>{class i{static \u0275fac=function(t){return new(t||i)};static \u0275mod=h({type:i});static \u0275inj=d({})}return i})();export{z as a,H as b};
