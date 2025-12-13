import{a as ft,b as ht}from"./chunk-XZVY7D3K.js";import{a as J,b as vt}from"./chunk-MX3PZFJO.js";import{I as pt,J as G,L as dt,O as $,k as st,o as rt,r as k,u as z}from"./chunk-G4GGURKU.js";import{D as F,G as W,R as U,fa as ut,k as lt,r as ct,s as bt,t as L,z as q}from"./chunk-5GYOOLE2.js";import{Ab as j,Bb as A,Gb as I,Hb as f,Ib as T,Jb as w,Kb as Q,Lb as x,Ma as v,Mb as l,Nb as c,P as B,Q as X,R as Y,Va as R,W as p,Ya as g,Yb as nt,Za as tt,_b as it,aa as O,ab as m,ba as V,bb as et,cb as u,da as h,kb as r,lb as M,ma as d,na as Z,nb as _,oa as P,qb as y,uc as C,vb as D,vc as at,wb as N,xb as S,xc as s,yc as ot}from"./chunk-HE3ZW6WA.js";var _t=["previcon"],yt=["nexticon"],Tt=["content"],wt=["prevButton"],xt=["nextButton"],Ct=["inkbar"],kt=["tabs"],E=["*"],$t=t=>({"p-tablist-viewport":t});function Bt(t,b){t&1&&j(0)}function Dt(t,b){if(t&1&&u(0,Bt,1,0,"ng-container",11),t&2){let e=f(2);M("ngTemplateOutlet",e.prevIconTemplate||e._prevIconTemplate)}}function It(t,b){t&1&&S(0,"ChevronLeftIcon")}function Lt(t,b){if(t&1){let e=A();D(0,"button",10,3),I("click",function(){O(e);let n=f();return V(n.onPrevButtonClick())}),u(2,Dt,1,1,"ng-container")(3,It,1,0,"ChevronLeftIcon"),N()}if(t&2){let e=f();r("aria-label",e.prevButtonAriaLabel)("tabindex",e.tabindex())("data-pc-group-section","navigator"),v(2),y(e.prevIconTemplate||e._prevIconTemplate?2:3)}}function Ft(t,b){t&1&&j(0)}function Et(t,b){if(t&1&&u(0,Ft,1,0,"ng-container",11),t&2){let e=f(2);M("ngTemplateOutlet",e.nextIconTemplate||e._nextIconTemplate)}}function Ot(t,b){t&1&&S(0,"ChevronRightIcon")}function Vt(t,b){if(t&1){let e=A();D(0,"button",12,4),I("click",function(){O(e);let n=f();return V(n.onNextButtonClick())}),u(2,Et,1,1,"ng-container")(3,Ot,1,0,"ChevronRightIcon"),N()}if(t&2){let e=f();r("aria-label",e.nextButtonAriaLabel)("tabindex",e.tabindex())("data-pc-group-section","navigator"),v(2),y(e.nextIconTemplate||e._nextIconTemplate?2:3)}}function Pt(t,b){t&1&&w(0)}var Rt=({dt:t})=>`
.p-tabs {
    display: flex;
    flex-direction: column;
}

.p-tablist {
    display: flex;
    position: relative;
}

.p-tabs-scrollable > .p-tablist {
    overflow: hidden;
}

.p-tablist-viewport {
    overflow-x: auto;
    overflow-y: hidden;
    scroll-behavior: smooth;
    scrollbar-width: none;
    overscroll-behavior: contain auto;
}

.p-tablist-viewport::-webkit-scrollbar {
    display: none;
}

.p-tablist-tab-list {
    position: relative;
    display: flex;
    background: ${t("tabs.tablist.background")};
    border-style: solid;
    border-color: ${t("tabs.tablist.border.color")};
    border-width: ${t("tabs.tablist.border.width")};
}

.p-tablist-content {
    flex-grow: 1;
}

.p-tablist-nav-button {
    all: unset;
    position: absolute !important;
    flex-shrink: 0;
    top: 0;
    z-index: 2;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: ${t("tabs.nav.button.background")};
    color: ${t("tabs.nav.button.color")};
    width: ${t("tabs.nav.button.width")};
    transition: color ${t("tabs.transition.duration")}, outline-color ${t("tabs.transition.duration")}, box-shadow ${t("tabs.transition.duration")};
    box-shadow: ${t("tabs.nav.button.shadow")};
    outline-color: transparent;
    cursor: pointer;
}

.p-tablist-nav-button:focus-visible {
    z-index: 1;
    box-shadow: ${t("tabs.nav.button.focus.ring.shadow")};
    outline: ${t("tabs.nav.button.focus.ring.width")} ${t("tabs.nav.button.focus.ring.style")} ${t("tabs.nav.button.focus.ring.color")};
    outline-offset: ${t("tabs.nav.button.focus.ring.offset")};
}

.p-tablist-nav-button:hover {
    color: ${t("tabs.nav.button.hover.color")};
}

.p-tablist-prev-button {
    left: 0;
}

.p-tablist-next-button {
    right: 0;
}

.p-tab {
    display: flex;
    align-items: center;
    flex-shrink: 0;
    cursor: pointer;
    user-select: none;
    position: relative;
    border-style: solid;
    white-space: nowrap;
    gap: ${t("tabs.tab.gap")};
    background: ${t("tabs.tab.background")};
    border-width: ${t("tabs.tab.border.width")};
    border-color: ${t("tabs.tab.border.color")};
    color: ${t("tabs.tab.color")};
    padding: ${t("tabs.tab.padding")};
    font-weight: ${t("tabs.tab.font.weight")};
    transition: background ${t("tabs.transition.duration")}, border-color ${t("tabs.transition.duration")}, color ${t("tabs.transition.duration")}, outline-color ${t("tabs.transition.duration")}, box-shadow ${t("tabs.transition.duration")};
    margin: ${t("tabs.tab.margin")};
    outline-color: transparent;
}

.p-tab:not(.p-disabled):focus-visible {
    z-index: 1;
    box-shadow: ${t("tabs.tab.focus.ring.shadow")};
    outline: ${t("tabs.tab.focus.ring.width")} ${t("tabs.tab.focus.ring.style")} ${t("tabs.tab.focus.ring.color")};
    outline-offset: ${t("tabs.tab.focus.ring.offset")};
}

.p-tab:not(.p-tab-active):not(.p-disabled):hover {
    background: ${t("tabs.tab.hover.background")};
    border-color: ${t("tabs.tab.hover.border.color")};
    color: ${t("tabs.tab.hover.color")};
}

.p-tab-active {
    background: ${t("tabs.tab.active.background")};
    border-color: ${t("tabs.tab.active.border.color")};
    color: ${t("tabs.tab.active.color")};
}

.p-tabpanels {
    background: ${t("tabs.tabpanel.background")};
    color: ${t("tabs.tabpanel.color")};
    padding: ${t("tabs.tabpanel.padding")};
    outline: 0 none;
}

.p-tabpanel:focus-visible {
    box-shadow: ${t("tabs.tabpanel.focus.ring.shadow")};
    outline: ${t("tabs.tabpanel.focus.ring.width")} ${t("tabs.tabpanel.focus.ring.style")} ${t("tabs.tabpanel.focus.ring.color")};
    outline-offset: ${t("tabs.tabpanel.focus.ring.offset")};
}

.p-tablist-active-bar {
    z-index: 1;
    display: block;
    position: absolute;
    bottom: ${t("tabs.active.bar.bottom")};
    height: ${t("tabs.active.bar.height")};
    background: ${t("tabs.active.bar.background")};
    transition: 250ms cubic-bezier(0.35, 0, 0.25, 1);
}
`,Mt={root:({props:t})=>["p-tabs p-component",{"p-tabs-scrollable":t.scrollable}]},gt=(()=>{class t extends dt{name="tabs";theme=Rt;classes=Mt;static \u0275fac=(()=>{let e;return function(n){return(e||(e=h(t)))(n||t)}})();static \u0275prov=X({token:t,factory:t.\u0275fac})}return t})(),Nt=function(t){return t.root="p-tabs",t.list="p-tablist",t.content="p-tablist-content",t.tablist="p-tablist-tab-list",t.tab="p-tab",t.inkbar="p-tablist-active-bar",t.button="p-tablist-nav-button",t.tabpanels="p-tabpanels",t.tabpanel="p-tabs-panel",t}(Nt||{}),mt=(()=>{class t extends ${prevIconTemplate;nextIconTemplate;templates;content;prevButton;nextButton;inkbar;tabs;pcTabs=p(B(()=>K));isPrevButtonEnabled=P(!1);isNextButtonEnabled=P(!1);resizeObserver;showNavigators=s(()=>this.pcTabs.showNavigators());tabindex=s(()=>this.pcTabs.tabindex());scrollable=s(()=>this.pcTabs.scrollable());constructor(){super(),ot(()=>{this.pcTabs.value(),z(this.platformId)&&setTimeout(()=>{this.updateInkBar()})})}get prevButtonAriaLabel(){return this.config.translation.aria.previous}get nextButtonAriaLabel(){return this.config.translation.aria.next}ngAfterViewInit(){super.ngAfterViewInit(),this.showNavigators()&&z(this.platformId)&&(this.updateButtonState(),this.bindResizeObserver())}_prevIconTemplate;_nextIconTemplate;ngAfterContentInit(){this.templates.forEach(e=>{switch(e.getType()){case"previcon":this._prevIconTemplate=e.template;break;case"nexticon":this._nextIconTemplate=e.template;break}})}ngOnDestroy(){this.unbindResizeObserver(),super.ngOnDestroy()}onScroll(e){this.showNavigators()&&this.updateButtonState(),e.preventDefault()}onPrevButtonClick(){let e=this.content.nativeElement,i=F(e),n=Math.abs(e.scrollLeft)-i,a=n<=0?0:n;e.scrollLeft=W(e)?-1*a:a}onNextButtonClick(){let e=this.content.nativeElement,i=F(e)-this.getVisibleButtonWidths(),n=e.scrollLeft+i,a=e.scrollWidth-i,o=n>=a?a:n;e.scrollLeft=W(e)?-1*o:o}updateButtonState(){let e=this.content?.nativeElement,i=this.el?.nativeElement,{scrollWidth:n,offsetWidth:a}=e,o=Math.abs(e.scrollLeft),H=F(e);this.isPrevButtonEnabled.set(o!==0),this.isNextButtonEnabled.set(i.offsetWidth>=a&&o!==n-H)}updateInkBar(){let e=this.content?.nativeElement,i=this.inkbar?.nativeElement,n=this.tabs?.nativeElement,a=ct(e,'[data-pc-name="tab"][data-p-active="true"]');i&&(i.style.width=lt(a)+"px",i.style.left=q(a).left-q(n).left+"px")}getVisibleButtonWidths(){let e=this.prevButton?.nativeElement,i=this.nextButton?.nativeElement;return[e,i].reduce((n,a)=>a?n+F(a):n,0)}bindResizeObserver(){this.resizeObserver=new ResizeObserver(()=>this.updateButtonState()),this.resizeObserver.observe(this.el.nativeElement)}unbindResizeObserver(){this.resizeObserver&&(this.resizeObserver.unobserve(this.el.nativeElement),this.resizeObserver=null)}static \u0275fac=function(i){return new(i||t)};static \u0275cmp=g({type:t,selectors:[["p-tablist"]],contentQueries:function(i,n,a){if(i&1&&(Q(a,_t,4),Q(a,yt,4),Q(a,pt,4)),i&2){let o;l(o=c())&&(n.prevIconTemplate=o.first),l(o=c())&&(n.nextIconTemplate=o.first),l(o=c())&&(n.templates=o)}},viewQuery:function(i,n){if(i&1&&(x(Tt,5),x(wt,5),x(xt,5),x(Ct,5),x(kt,5)),i&2){let a;l(a=c())&&(n.content=a.first),l(a=c())&&(n.prevButton=a.first),l(a=c())&&(n.nextButton=a.first),l(a=c())&&(n.inkbar=a.first),l(a=c())&&(n.tabs=a.first)}},hostVars:5,hostBindings:function(i,n){i&2&&(r("data-pc-name","tablist"),_("p-tablist",!0)("p-component",!0))},features:[m],ngContentSelectors:E,decls:9,vars:6,consts:[["content",""],["tabs",""],["inkbar",""],["prevButton",""],["nextButton",""],["type","button","pRipple","",1,"p-tablist-nav-button","p-tablist-prev-button"],[1,"p-tablist-content",3,"scroll","ngClass"],["role","tablist",1,"p-tablist-tab-list"],["role","presentation",1,"p-tablist-active-bar"],["type","button","pRipple","",1,"p-tablist-nav-button","p-tablist-next-button"],["type","button","pRipple","",1,"p-tablist-nav-button","p-tablist-prev-button",3,"click"],[4,"ngTemplateOutlet"],["type","button","pRipple","",1,"p-tablist-nav-button","p-tablist-next-button",3,"click"]],template:function(i,n){if(i&1){let a=A();T(),u(0,Lt,4,4,"button",5),D(1,"div",6,0),I("scroll",function(H){return O(a),V(n.onScroll(H))}),D(3,"div",7,1),w(5),S(6,"span",8,2),N()(),u(8,Vt,4,4,"button",9)}i&2&&(y(n.showNavigators()&&n.isPrevButtonEnabled()?0:-1),v(),M("ngClass",it(4,$t,n.scrollable())),v(5),r("data-pc-section","inkbar"),v(2),y(n.showNavigators()&&n.isNextButtonEnabled()?8:-1))},dependencies:[k,st,rt,ft,ht,vt,J,G],encapsulation:2,changeDetection:0})}return t})(),St=(()=>{class t extends ${value=R();disabled=d(!1,{transform:C});pcTabs=p(B(()=>K));pcTabList=p(B(()=>mt));el=p(Z);ripple=s(()=>this.config.ripple());id=s(()=>`${this.pcTabs.id()}_tab_${this.value()}`);ariaControls=s(()=>`${this.pcTabs.id()}_tabpanel_${this.value()}`);active=s(()=>U(this.pcTabs.value(),this.value()));tabindex=s(()=>this.active()?this.pcTabs.tabindex():-1);mutationObserver;onFocus(e){this.pcTabs.selectOnFocus()&&this.changeActiveValue()}onClick(e){this.changeActiveValue()}onKeyDown(e){switch(e.code){case"ArrowRight":this.onArrowRightKey(e);break;case"ArrowLeft":this.onArrowLeftKey(e);break;case"Home":this.onHomeKey(e);break;case"End":this.onEndKey(e);break;case"PageDown":this.onPageDownKey(e);break;case"PageUp":this.onPageUpKey(e);break;case"Enter":case"NumpadEnter":case"Space":this.onEnterKey(e);break;default:break}e.stopPropagation()}ngAfterViewInit(){super.ngAfterViewInit(),this.bindMutationObserver()}onArrowRightKey(e){let i=this.findNextTab(e.currentTarget);i?this.changeFocusedTab(e,i):this.onHomeKey(e),e.preventDefault()}onArrowLeftKey(e){let i=this.findPrevTab(e.currentTarget);i?this.changeFocusedTab(e,i):this.onEndKey(e),e.preventDefault()}onHomeKey(e){let i=this.findFirstTab();this.changeFocusedTab(e,i),e.preventDefault()}onEndKey(e){let i=this.findLastTab();this.changeFocusedTab(e,i),e.preventDefault()}onPageDownKey(e){this.scrollInView(this.findLastTab()),e.preventDefault()}onPageUpKey(e){this.scrollInView(this.findFirstTab()),e.preventDefault()}onEnterKey(e){this.changeActiveValue(),e.preventDefault()}findNextTab(e,i=!1){let n=i?e:e.nextElementSibling;return n?L(n,"data-p-disabled")||L(n,"data-pc-section")==="inkbar"?this.findNextTab(n):n:null}findPrevTab(e,i=!1){let n=i?e:e.previousElementSibling;return n?L(n,"data-p-disabled")||L(n,"data-pc-section")==="inkbar"?this.findPrevTab(n):n:null}findFirstTab(){return this.findNextTab(this.pcTabList?.tabs?.nativeElement?.firstElementChild,!0)}findLastTab(){return this.findPrevTab(this.pcTabList?.tabs?.nativeElement?.lastElementChild,!0)}changeActiveValue(){this.pcTabs.updateValue(this.value())}changeFocusedTab(e,i){bt(i),this.scrollInView(i)}scrollInView(e){e?.scrollIntoView?.({block:"nearest"})}bindMutationObserver(){z(this.platformId)&&(this.mutationObserver=new MutationObserver(e=>{e.forEach(()=>{this.active()&&this.pcTabList?.updateInkBar()})}),this.mutationObserver.observe(this.el.nativeElement,{childList:!0,characterData:!0,subtree:!0}))}unbindMutationObserver(){this.mutationObserver.disconnect()}ngOnDestroy(){this.mutationObserver&&this.unbindMutationObserver(),super.ngOnDestroy()}static \u0275fac=(()=>{let e;return function(n){return(e||(e=h(t)))(n||t)}})();static \u0275cmp=g({type:t,selectors:[["p-tab"]],hostVars:16,hostBindings:function(i,n){i&1&&I("focus",function(o){return n.onFocus(o)})("click",function(o){return n.onClick(o)})("keydown",function(o){return n.onKeyDown(o)}),i&2&&(r("data-pc-name","tab")("id",n.id())("aria-controls",n.ariaControls())("role","tab")("aria-selected",n.active())("data-p-disabled",n.disabled())("data-p-active",n.active())("tabindex",n.tabindex()),_("p-tab",!0)("p-tab-active",n.active())("p-disabled",n.disabled())("p-component",!0))},inputs:{value:[1,"value"],disabled:[1,"disabled"]},outputs:{value:"valueChange"},features:[et([J]),m],ngContentSelectors:E,decls:1,vars:0,template:function(i,n){i&1&&(T(),w(0))},dependencies:[k,G],encapsulation:2,changeDetection:0})}return t})(),At=(()=>{class t extends ${pcTabs=p(B(()=>K));value=R(void 0);id=s(()=>`${this.pcTabs.id()}_tabpanel_${this.value()}`);ariaLabelledby=s(()=>`${this.pcTabs.id()}_tab_${this.value()}`);active=s(()=>U(this.pcTabs.value(),this.value()));static \u0275fac=(()=>{let e;return function(n){return(e||(e=h(t)))(n||t)}})();static \u0275cmp=g({type:t,selectors:[["p-tabpanel"]],hostVars:9,hostBindings:function(i,n){i&2&&(r("data-pc-name","tabpanel")("id",n.id())("role","tabpanel")("aria-labelledby",n.ariaLabelledby())("data-p-active",n.active()),_("p-tabpanel",!0)("p-component",!0))},inputs:{value:[1,"value"]},outputs:{value:"valueChange"},features:[m],ngContentSelectors:E,decls:1,vars:1,template:function(i,n){i&1&&(T(),u(0,Pt,1,0)),i&2&&y(n.active()?0:-1)},dependencies:[k],encapsulation:2,changeDetection:0})}return t})(),Qt=(()=>{class t extends ${static \u0275fac=(()=>{let e;return function(n){return(e||(e=h(t)))(n||t)}})();static \u0275cmp=g({type:t,selectors:[["p-tabpanels"]],hostVars:6,hostBindings:function(i,n){i&2&&(r("data-pc-name","tabpanels")("role","presentation"),_("p-tabpanels",!0)("p-component",!0))},features:[m],ngContentSelectors:E,decls:1,vars:0,template:function(i,n){i&1&&(T(),w(0))},dependencies:[k],encapsulation:2,changeDetection:0})}return t})(),K=(()=>{class t extends ${value=R(void 0);scrollable=d(!1,{transform:C});lazy=d(!1,{transform:C});selectOnFocus=d(!1,{transform:C});showNavigators=d(!0,{transform:C});tabindex=d(0,{transform:at});id=P(ut("pn_id_"));_componentStyle=p(gt);updateValue(e){this.value.update(()=>e)}static \u0275fac=(()=>{let e;return function(n){return(e||(e=h(t)))(n||t)}})();static \u0275cmp=g({type:t,selectors:[["p-tabs"]],hostVars:8,hostBindings:function(i,n){i&2&&(r("data-pc-name","tabs")("id",n.id()),_("p-tabs",!0)("p-tabs-scrollable",n.scrollable())("p-component",!0))},inputs:{value:[1,"value"],scrollable:[1,"scrollable"],lazy:[1,"lazy"],selectOnFocus:[1,"selectOnFocus"],showNavigators:[1,"showNavigators"],tabindex:[1,"tabindex"]},outputs:{value:"valueChange"},features:[nt([gt]),m],ngContentSelectors:E,decls:1,vars:0,template:function(i,n){i&1&&(T(),w(0))},dependencies:[k],encapsulation:2,changeDetection:0})}return t})(),ce=(()=>{class t{static \u0275fac=function(i){return new(i||t)};static \u0275mod=tt({type:t});static \u0275inj=Y({imports:[K,Qt,At,mt,St]})}return t})();export{gt as a,Nt as b,mt as c,St as d,At as e,Qt as f,K as g,ce as h};
