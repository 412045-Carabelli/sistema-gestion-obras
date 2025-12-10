import{L as y,O as $,r as h}from"./chunk-G4GGURKU.js";import{Ib as m,Jb as u,Q as s,R as c,W as l,Ya as f,Yb as g,Za as r,ab as a,da as t,nb as d,pb as p}from"./chunk-HE3ZW6WA.js";var F=["*"],z=({dt:i})=>`
.p-iconfield {
    position: relative;
    display: block;
}

.p-inputicon {
    position: absolute;
    top: 50%;
    margin-top: calc(-1 * (${i("icon.size")} / 2));
    color: ${i("iconfield.icon.color")};
    line-height: 1;
}

.p-iconfield .p-inputicon:first-child {
    inset-inline-start: ${i("form.field.padding.x")};
}

.p-iconfield .p-inputicon:last-child {
    inset-inline-end: ${i("form.field.padding.x")};
}

.p-iconfield .p-inputtext:not(:first-child) {
    padding-inline-start: calc((${i("form.field.padding.x")} * 2) + ${i("icon.size")});
}

.p-iconfield .p-inputtext:not(:last-child) {
    padding-inline-end: calc((${i("form.field.padding.x")} * 2) + ${i("icon.size")});
}

.p-iconfield:has(.p-inputfield-sm) .p-inputicon {
    font-size: ${i("form.field.sm.font.size")};
    width: ${i("form.field.sm.font.size")};
    height: ${i("form.field.sm.font.size")};
    margin-top: calc(-1 * (${i("form.field.sm.font.size")} / 2));
}

.p-iconfield:has(.p-inputfield-lg) .p-inputicon {
    font-size: ${i("form.field.lg.font.size")};
    width: ${i("form.field.lg.font.size")};
    height: ${i("form.field.lg.font.size")};
    margin-top: calc(-1 * (${i("form.field.lg.font.size")} / 2));
}
`,C={root:"p-iconfield"},v=(()=>{class i extends y{name="iconfield";theme=z;classes=C;static \u0275fac=(()=>{let e;return function(n){return(e||(e=t(i)))(n||i)}})();static \u0275prov=s({token:i,factory:i.\u0275fac})}return i})(),I=function(i){return i.root="p-iconfield",i}(I||{}),M=(()=>{class i extends ${iconPosition="left";get _styleClass(){return this.styleClass}styleClass;_componentStyle=l(v);static \u0275fac=(()=>{let e;return function(n){return(e||(e=t(i)))(n||i)}})();static \u0275cmp=f({type:i,selectors:[["p-iconfield"],["p-iconField"],["p-icon-field"]],hostAttrs:[1,"p-iconfield"],hostVars:6,hostBindings:function(o,n){o&2&&(p(n._styleClass),d("p-iconfield-left",n.iconPosition==="left")("p-iconfield-right",n.iconPosition==="right"))},inputs:{iconPosition:"iconPosition",styleClass:"styleClass"},features:[g([v]),a],ngContentSelectors:F,decls:1,vars:0,template:function(o,n){o&1&&(m(),u(0))},dependencies:[h],encapsulation:2,changeDetection:0})}return i})(),_=(()=>{class i{static \u0275fac=function(o){return new(o||i)};static \u0275mod=r({type:i});static \u0275inj=c({imports:[M]})}return i})();export{v as a,I as b,M as c,_ as d};
