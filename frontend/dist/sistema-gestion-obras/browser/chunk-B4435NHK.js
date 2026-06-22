import{d as m,h as y}from"./chunk-TF3UNNHN.js";import{m as b,p as $}from"./chunk-2ODCKNDF.js";import{$a as h,Gb as v,O as l,P as s,Qa as r,U as d,Ya as p,Za as f,Zb as x,ba as u,ha as c,ob as g,vc as o}from"./chunk-D22PL7CT.js";var I=({dt:e})=>`
.p-textarea {
    font-family: inherit;
    font-feature-settings: inherit;
    font-size: 1rem;
    color: ${e("textarea.color")};
    background: ${e("textarea.background")};
    padding: ${e("textarea.padding.y")} ${e("textarea.padding.x")};
    border: 1px solid ${e("textarea.border.color")};
    transition: background ${e("textarea.transition.duration")}, color ${e("textarea.transition.duration")}, border-color ${e("textarea.transition.duration")}, outline-color ${e("textarea.transition.duration")}, box-shadow ${e("textarea.transition.duration")};
    appearance: none;
    border-radius: ${e("textarea.border.radius")};
    outline-color: transparent;
    box-shadow: ${e("textarea.shadow")};
}

.p-textarea:enabled:hover {
    border-color: ${e("textarea.hover.border.color")};
}

.p-textarea:enabled:focus {
    border-color: ${e("textarea.focus.border.color")};
    box-shadow: ${e("textarea.focus.ring.shadow")};
    outline: ${e("textarea.focus.ring.width")} ${e("textarea.focus.ring.style")} ${e("textarea.focus.ring.color")};
    outline-offset: ${e("textarea.focus.ring.offset")};
}

.p-textarea.p-invalid {
    border-color: ${e("textarea.invalid.border.color")};
}

.p-textarea.p-variant-filled {
    background: ${e("textarea.filled.background")};
}

.p-textarea.p-variant-filled:enabled:focus {
    background: ${e("textarea.filled.focus.background")};
}

.p-textarea:disabled {
    opacity: 1;
    background: ${e("textarea.disabled.background")};
    color: ${e("textarea.disabled.color")};
}

.p-textarea::placeholder {
    color: ${e("textarea.placeholder.color")};
}

.p-textarea-fluid {
    width: 100%;
}

.p-textarea-resizable {
    overflow: hidden;
    resize: none;
}

.p-textarea.ng-invalid.ng-dirty {
    border-color: ${e("textarea.invalid.border.color")}
}

.p-textarea.ng-invalid.ng-dirty::placeholder {
    color: ${e("textarea.invalid.placeholder.color")};
}`,M={root:({instance:e,props:n})=>["p-textarea p-component",{"p-filled":e.filled,"p-textarea-resizable ":n.autoResize,"p-invalid":n.invalid,"p-variant-filled":n.variant?n.variant==="filled":e.config.inputStyle==="filled"||e.config.inputVariant==="filled","p-textarea-fluid":n.fluid}]},z=(()=>{class e extends b{name="textarea";theme=I;classes=M;static \u0275fac=(()=>{let t;return function(a){return(t||(t=u(e)))(a||e)}})();static \u0275prov=l({token:e,factory:e.\u0275fac})}return e})(),E=function(e){return e.root="p-textarea",e}(E||{}),N=(()=>{class e extends ${ngModel;control;autoResize;variant;fluid=!1;onResize=new c;filled;cachedScrollHeight;ngModelSubscription;ngControlSubscription;_componentStyle=d(z);constructor(t,i){super(),this.ngModel=t,this.control=i,console.log("pInputTextarea directive is deprecated in v18. Use pTextarea directive instead")}ngOnInit(){super.ngOnInit(),this.ngModel&&(this.ngModelSubscription=this.ngModel.valueChanges.subscribe(()=>{this.updateState()})),this.control&&(this.ngControlSubscription=this.control.valueChanges.subscribe(()=>{this.updateState()}))}get hasFluid(){let i=this.el.nativeElement.closest("p-fluid");return this.fluid||!!i}ngAfterViewInit(){super.ngAfterViewInit(),this.autoResize&&this.resize(),this.updateFilledState(),this.cd.detectChanges()}onInput(t){this.updateState()}updateFilledState(){this.filled=this.el.nativeElement.value&&this.el.nativeElement.value.length}resize(t){this.el.nativeElement.style.height="auto",this.el.nativeElement.style.height=this.el.nativeElement.scrollHeight+"px",parseFloat(this.el.nativeElement.style.height)>=parseFloat(this.el.nativeElement.style.maxHeight)?(this.el.nativeElement.style.overflowY="scroll",this.el.nativeElement.style.height=this.el.nativeElement.style.maxHeight):this.el.nativeElement.style.overflow="hidden",this.onResize.emit(t||{})}updateState(){this.updateFilledState(),this.autoResize&&this.resize()}ngOnDestroy(){this.ngModelSubscription&&this.ngModelSubscription.unsubscribe(),this.ngControlSubscription&&this.ngControlSubscription.unsubscribe(),super.ngOnDestroy()}static \u0275fac=function(i){return new(i||e)(r(y,8),r(m,8))};static \u0275dir=f({type:e,selectors:[["","pInputTextarea",""]],hostAttrs:[1,"p-textarea","p-component"],hostVars:8,hostBindings:function(i,a){i&1&&v("input",function(S){return a.onInput(S)}),i&2&&g("p-filled",a.filled)("p-textarea-resizable",a.autoResize)("p-variant-filled",a.variant==="filled"||a.config.inputStyle()==="filled"||a.config.inputVariant()==="filled")("p-textarea-fluid",a.hasFluid)},inputs:{autoResize:[2,"autoResize","autoResize",o],variant:"variant",fluid:[2,"fluid","fluid",o]},outputs:{onResize:"onResize"},features:[x([z]),h]})}return e})(),P=(()=>{class e{static \u0275fac=function(i){return new(i||e)};static \u0275mod=p({type:e});static \u0275inj=s({})}return e})();export{z as a,E as b,N as c,P as d};
