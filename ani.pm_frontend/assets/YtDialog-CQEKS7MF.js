import{j as e}from"./query-V7WhSRdC.js";import{r as n,a as E}from"./react-DeiVZVzB.js";import{u as L}from"./useScrollLock-Cdj37EJx.js";import{a2 as R,eg as D,I,cl as C,O as Y}from"./index-DQbZxriH.js";const $=R("dialog",{"a11y.close":"Close"}),w=D,O=`
.ytdlg-host {
  position: fixed; inset: 0;
  display: flex; align-items: center; justify-content: center;
}
.ytdlg-scrim {
  position: absolute; inset: 0;
  background-color: #000; opacity: .6;

  animation: ytdlg-scrim-in 220ms cubic-bezier(.16, 1, .3, 1);
}
@keyframes ytdlg-scrim-in { from { opacity: 0 } to { opacity: .6 } }
@keyframes ytdlg-panel-in { from { opacity: 0; transform: scale(.965) } to { opacity: 1; transform: none } }

.ytdlg-panel {
  position: relative;
  display: flex; flex-direction: column; box-sizing: border-box;

  background-color: rgba(23, 23, 27, .92);
  -webkit-backdrop-filter: saturate(150%) blur(28px);
  backdrop-filter: saturate(150%) blur(28px);
  color: #f1f1f1;
  border-radius: 16px; overflow: hidden;   
  box-shadow: 0 24px 64px -12px rgba(0, 0, 0, .8), inset 0 1px 0 rgba(255, 255, 255, .07);

  animation: ytdlg-panel-in 280ms cubic-bezier(.16, 1, .3, 1);
}
.ytdlg-panel:focus { outline: none; }

@media (max-width: 330px) {
  .ytdlg-panel { min-width: calc(100vw - 96px); max-width: 100%; max-height: 100vh; }
}
@media (min-width: 331px) and (max-width: 527px) {
  .ytdlg-panel {
    min-width: calc(100vw - 96px); min-width: min(320px, 100vw - 96px);
    max-width: calc(100vw - 96px); max-width: min(400px, 100vw - 96px);
    max-height: calc(100vh - 96px);
  }
}
@media (min-width: 528px) {
  .ytdlg-panel {
    min-width: 320px;
    max-width: calc(100vw - 96px); max-width: min(560px, 100vw - 96px);
    max-height: calc(100vh - 96px); max-height: min(560px, 100vh - 96px);
  }
}
.ytdlg-container {
  display: flex; flex-direction: column; overflow: hidden;
  min-height: 0; padding-bottom: 24px;
}

.ytdlg-header { flex: 0 0 auto; padding: 20px 20px 6px; }
.ytdlg-headerrow { display: flex; flex-direction: row; align-items: center; flex-shrink: 0; }
.ytdlg-title {
  flex: 1; min-width: 0; margin: 0;
  color: #f1f1f1; font-size: 20px; line-height: 28px; font-weight: 700;
}
.ytdlg-close {
  flex: 0 0 auto; margin-left: 12px;
  display: grid; place-items: center;
  width: 40px; height: 40px; padding: 8px;
  border: 0; border-radius: 50%;
  background: transparent; color: #f1f1f1; cursor: pointer;
}
.ytdlg-close:hover { background-color: rgba(255, 255, 255, .1); }
.ytdlg-close svg { display: block; width: 24px; height: 24px; }

.ytdlg-scrollwrap { position: relative; display: flex; min-height: 0; }
.ytdlg-scrollwrap.ytdlg-is-scrolled::before,
.ytdlg-scrollwrap.ytdlg-can-scroll::after {
  content: ''; position: absolute; left: 0; right: 0; height: 1px;
  background: rgba(255, 255, 255, .2); z-index: 1; pointer-events: none;
}
.ytdlg-scrollwrap.ytdlg-is-scrolled::before { top: 0; }
.ytdlg-scrollwrap.ytdlg-can-scroll::after { bottom: 0; }
.ytdlg-content {
  flex: 1 1 auto; min-width: 0; min-height: 0;
  width: 100%; overflow-y: auto; overscroll-behavior: contain;
  color: #f1f1f1;
}
.ytdlg-contentinner { overflow: visible; padding: 0 20px; }
.ytdlg-desc { margin: 0; color: #aaa; font-size: 14px; line-height: 20px; font-weight: 400; }
.ytdlg-desc:not(:last-child) { margin-bottom: 20px; }

.ytdlg-footercontainer { flex: 0 0 auto; padding-top: 16px; padding-left: 20px; padding-right: 20px; }
.ytdlg-footer {
  display: flex; flex-flow: row wrap-reverse; flex-shrink: 0;
  justify-content: end; margin: -8px 0 0 -8px;
}
.ytdlg-footerbtn { display: flex; padding: 8px 0 0 8px; }

.ytdlg-list { display: grid; gap: 6px; margin: 0; padding: 0; border: 0; min-width: 0; }
.ytdlg-list > legend { padding: 0; }
.ytdlg-list__legend { display: block; margin: 0 0 8px; }
.ytdlg-row {
  position: relative; box-sizing: border-box;
  display: flex; flex-direction: row; align-items: center;
  width: 100%; padding: 8px 12px; border-radius: 12px;   
  background-color: rgba(255, 255, 255, .05);
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, .05);
  cursor: pointer; user-select: none;
  transition: background-color .18s ease, box-shadow .18s ease;
}
@media (hover: hover) { .ytdlg-row:hover { background-color: rgba(255, 255, 255, .09); } }

@supports selector(:has(*)) {
  .ytdlg-row:has(.ytdlg-radio__input:checked) {
    background-color: rgb(var(--wa-acc-solid) / .16);
    box-shadow: inset 0 0 0 1px rgb(var(--wa-acc-solid) / .55);
  }
}
.ytdlg-row:focus-within {
  background-color: rgba(255, 255, 255, .1);
  outline: 2px solid currentColor; outline-offset: -2px; border-radius: 12px;
}

@supports selector(:has(*)) {
  .ytdlg-row:focus-within:not(:has(:focus-visible)) { outline: none; }
  .ytdlg-inlinerow:focus-within:not(:has(:focus-visible)) { outline: none; }
}
.ytdlg-row__leading { flex: 0 0 auto; align-self: start; margin-right: 12px; display: flex; align-items: center; height: 32px; }
.ytdlg-row__text { display: flex; flex-direction: column; flex-grow: 1; min-width: 0; min-height: 32px; justify-content: center; }

.ytdlg-row__title { color: #f1f1f1; font-size: 14px; line-height: 20px; font-weight: 500; }
.ytdlg-row__sub { margin-top: 2px; color: #aaa; font-size: 12px; line-height: 16px; font-weight: 400; }

.ytdlg-radio {
  position: relative; flex: 0 0 auto;
  display: inline-flex; align-items: center; justify-content: center;
  width: 16px; min-width: 16px; height: 16px; vertical-align: middle;
}
.ytdlg-radio__input { position: absolute; inset: 0; width: 100%; height: 100%; margin: 0; opacity: 0; cursor: pointer; }
.ytdlg-radio__off {
  position: absolute; box-sizing: border-box; top: 0; left: 0;
  width: 100%; height: 100%; border-radius: 50%;
  border: 2px solid #f1f1f1; background-color: transparent;
  transition: border-color .28s; pointer-events: none;
}
.ytdlg-radio__on {
  position: absolute; box-sizing: border-box; top: 0; left: 0;
  width: 100%; height: 100%; border-radius: 50%;

  background-color: rgb(var(--wa-acc-solid)); transform: scale(0);
  transition: transform .28s ease; will-change: transform; pointer-events: none;
}
.ytdlg-radio__input:checked ~ .ytdlg-radio__off { border-color: rgb(var(--wa-acc-solid)); }
.ytdlg-radio__input:checked ~ .ytdlg-radio__on { transform: scale(.5); }

.ytdlg-inlinegroup { display: flex; flex-flow: row wrap; gap: 8px; }
.ytdlg-inlinerow {
  display: inline-flex; align-items: center; justify-content: center;
  height: 32px; padding: 0 14px;
  border-radius: 999px;                                  
  background-color: rgba(255, 255, 255, .1);
  cursor: pointer; user-select: none;
  color: #f1f1f1; font-size: 14px; line-height: 20px; font-weight: 500;   
  transition: background-color .18s ease, color .18s ease;
}
@media (hover: hover) { .ytdlg-inlinerow:hover { background-color: rgba(255, 255, 255, .18); } }
.ytdlg-inlinerow > span:last-child { margin-inline-start: 0; }
.ytdlg-inlinerow .ytdlg-radio { width: 0; min-width: 0; height: 0; overflow: hidden; }
@supports selector(:has(*)) {
  .ytdlg-inlinerow:has(.ytdlg-radio__input:checked) {
    background-color: rgb(var(--wa-acc-solid));
    color: #000000;
  }
}
.ytdlg-inlinerow:focus-within { outline: 2px solid currentColor; outline-offset: 2px; border-radius: 999px; }

.ytdlg-label {
  display: block; margin-bottom: 8px;
  color: #aaa; font-size: 12px; line-height: 16px; font-weight: 600;
  letter-spacing: .03em;
}

.ytdlg-field {
  display: block; box-sizing: border-box; width: 100%; padding: 10px 12px;
  border: 0; border-radius: 12px;                        
  background: rgba(255, 255, 255, .06);
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, .06);
  color: #f1f1f1;
  font-size: 14px; line-height: 20px; font-weight: 400;
  outline: none; resize: none;
  transition: background-color .18s ease, box-shadow .18s ease;
}
.ytdlg-field::placeholder { color: #717171; }
.ytdlg-field:focus {
  background: rgba(255, 255, 255, .09);
  box-shadow: inset 0 0 0 1px rgb(var(--wa-acc-solid) / .8);
}
.ytdlg-note { margin: 0; color: #aaa; font-size: 12px; line-height: 18px; font-weight: 400; }
.ytdlg-stack { display: flex; flex-direction: column; gap: 20px; }

.ytdlg-panel :focus-visible { outline: 2px solid rgb(var(--wa-acc-solid)); outline-offset: 2px; }

.ytdlg-panel .ytdlg-field:focus-visible { outline: none; }
.ytdlg-row :focus-visible, .ytdlg-inlinerow :focus-visible { outline: none; }

html[data-animations='off'] .ytdlg-scrim,
html[data-animations='off'] .ytdlg-panel { animation: none; }
html[data-animations='off'] .ytdlg-radio__off,
html[data-animations='off'] .ytdlg-radio__on { transition: none; }
@media (prefers-reduced-motion: reduce) {
  .ytdlg-scrim, .ytdlg-panel { animation: none; }
  .ytdlg-radio__off, .ytdlg-radio__on { transition: none; }
}
`;function G({variant:t="text",className:i="",type:d="button",...s}){return e.jsx("span",{className:"ytdlg-footerbtn",children:e.jsx("button",{type:d,className:`yt-btn yt-btn--${t} ${i}`.trim(),...s})})}function v(t){return e.jsxs("span",{className:"ytdlg-radio",children:[e.jsx("input",{...t,type:"radio",className:"ytdlg-radio__input"}),e.jsx("span",{className:"ytdlg-radio__off","aria-hidden":"true"}),e.jsx("span",{className:"ytdlg-radio__on","aria-hidden":"true"})]})}function H({label:t,value:i,onChange:d,options:s,name:g,className:c=""}){const p=n.useId(),o=g??`ytdlg-opt-${p}`;return e.jsxs("fieldset",{className:`ytdlg-list ${c}`.trim(),children:[e.jsx("legend",{className:"ytdlg-list__legend ytdlg-label",children:t}),s.map(r=>e.jsxs("label",{className:"ytdlg-row",children:[e.jsx("span",{className:"ytdlg-row__leading",children:e.jsx(v,{name:o,value:r.value,checked:i===r.value,onChange:()=>d(r.value)})}),e.jsxs("span",{className:"ytdlg-row__text",children:[e.jsx("span",{className:"ytdlg-row__title",children:r.title}),r.subtitle&&e.jsx("span",{className:"ytdlg-row__sub",children:r.subtitle})]})]},r.value))]})}function M({label:t,value:i,onChange:d,options:s,name:g}){const c=n.useId(),p=g??`ytdlg-row-${c}`;return e.jsxs("fieldset",{className:"ytdlg-list",style:{margin:0},children:[e.jsx("legend",{className:"ytdlg-label",style:{margin:"0 0 8px"},children:t}),e.jsx("div",{className:"ytdlg-inlinegroup",children:s.map(o=>e.jsxs("label",{className:"ytdlg-inlinerow",children:[e.jsx(v,{name:p,value:o.value,checked:i===o.value,onChange:()=>d(o.value)}),e.jsx("span",{children:o.title})]},o.value))})]})}function B({open:t,onClose:i,title:d,description:s,children:g,footer:c,showClose:p=!0,closeLabel:o,zIndex:r=w,panelClassName:_=""}){const k=I($),j=o??k("a11y.close"),u=n.useRef(null),f=n.useRef(null),y=n.useId(),[m,N]=n.useState({scrolled:!1,more:!1}),z=Math.max(w,r);L(t),C(u,t),n.useEffect(()=>{if(!t)return;const l=a=>{a.key==="Escape"&&(a.preventDefault(),i())};return window.addEventListener("keydown",l),()=>window.removeEventListener("keydown",l)},[t,i]);const x=n.useCallback(()=>{const l=f.current;if(!l)return;const a=l.scrollTop>0,b=l.scrollHeight-l.clientHeight-l.scrollTop>1;N(h=>h.scrolled===a&&h.more===b?h:{scrolled:a,more:b})},[]);return n.useEffect(()=>{if(!t)return;const l=f.current;if(!l)return;x(),l.addEventListener("scroll",x,{passive:!0});const a=new ResizeObserver(x);return a.observe(l),l.firstElementChild&&a.observe(l.firstElementChild),()=>{l.removeEventListener("scroll",x),a.disconnect()}},[t,x]),t?E.createPortal(e.jsxs("div",{"data-modal-layer":"",className:"ytdlg-host",style:{zIndex:z},children:[e.jsx("style",{children:O}),e.jsx("div",{className:"ytdlg-scrim",onClick:i,"aria-hidden":"true"}),e.jsx("div",{ref:u,role:"dialog","aria-modal":"true","aria-labelledby":y,className:`ytdlg-panel ${_}`.trim(),children:e.jsxs("div",{className:"ytdlg-container",children:[e.jsx("div",{className:"ytdlg-header",children:e.jsxs("div",{className:"ytdlg-headerrow",children:[e.jsx("h2",{id:y,className:"ytdlg-title",children:d}),p&&e.jsx("button",{type:"button",className:"ytdlg-close",onClick:i,"aria-label":j,children:e.jsx(Y,{size:24})})]})}),e.jsx("div",{className:`ytdlg-scrollwrap${m.scrolled?" ytdlg-is-scrolled":""}${m.more?" ytdlg-can-scroll":""}`,children:e.jsx("div",{className:"ytdlg-content",ref:f,children:e.jsxs("div",{className:"ytdlg-contentinner",children:[s&&e.jsx("p",{className:"ytdlg-desc",children:s}),g]})})}),c&&e.jsx("div",{className:"ytdlg-footercontainer",children:e.jsx("div",{className:"ytdlg-footer",children:c})})]})})]}),document.body):null}export{w as Y,B as a,G as b,H as c,M as d};
