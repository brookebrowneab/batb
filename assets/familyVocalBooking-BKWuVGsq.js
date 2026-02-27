import{g as P}from"./index-BPlG99mH.js";import{f as T}from"./students-B3ZGlsBg.js";import{a as H,b as I,f as V,c as D,i as E,V as A,r as q,d as R,e as z,g as F}from"./vocalBookings-C7LsKPFp.js";import{f as x,L as Y,a as y}from"./scheduling-DSZ8OVmG.js";import{e as h}from"./escapeHtml-lW1fV86Q.js";import{f as N,a as O}from"./rolePreferences-CehJ0G8R.js";import{i as j}from"./rolePreferences-B9XCX_X4.js";let b={},g={};function se(){const i=document.createElement("div");return i.className="page",i.innerHTML=`
    <p><a href="#/family">← Back to Dashboard</a></p>
    <h1>Vocal Booking 🎤</h1>
    <p style="margin-bottom:var(--space-md)"><a href="#/family/dance" class="link-btn">View dance schedule →</a></p>
    <div id="vocal-content"><p>Loading…</p></div>
  `,setTimeout(async()=>{const{user:o}=P();if(!o)return;const n=document.getElementById("vocal-content");if(!n)return;const[s,l]=await Promise.all([T(o.id),N()]),a=s.data||[],r=l.data;if(a.length===0){n.innerHTML='<div class="placeholder-notice">No students registered yet. <a href="#/family/register">Start registration</a>.</div>';return}if(j(r)){const v={};await Promise.all(a.map(async c=>{const{data:u}=await O(c.id);u&&(v[c.id]=u)})),n.innerHTML=a.map(c=>{const u=v[c.id],p=u?`<div class="success-box" style="margin:var(--space-sm) 0;padding:var(--space-sm) var(--space-md);border-radius:var(--radius-sm)">
              <p style="font-size:var(--text-small)">Your vocal audition day: <strong>${x(u.audition_date)}</strong></p>
            </div>`:`<div class="placeholder-notice" style="margin:var(--space-sm) 0">
              Awaiting day assignment from the director. You'll be notified by email once assigned.
            </div>`;return`
          <div class="card" style="margin-bottom:var(--space-md)">
            <div style="display:flex;align-items:center;gap:var(--space-sm);margin-bottom:var(--space-sm)">
              <div class="avatar">${(c.first_name||"?")[0]}${(c.last_name||"?")[0]}</div>
              <h3 style="margin:0">${h(c.first_name||"Unnamed")} ${h(c.last_name||"Student")}</h3>
            </div>
            ${p}
          </div>
        `}).join("");return}const[e,m]=await Promise.all([H(),I()]),d=e.data||[],t=m.data||{};if(d.length===0){n.innerHTML='<div class="placeholder-notice">No vocal slots are available yet. Please check back later.</div>';return}const f={};await Promise.all(a.map(async v=>{const{data:c}=await V(v.id);c&&(f[v.id]=c)})),b={},$(n,a,d,t,f)},0),i}function $(i,o,n,s,l){const a=new Date,r=o.map(e=>{var v,c,u,p;const m=D(e),d=l[e.id],t=d==null?void 0:d.audition_slots,f=t?E(t.audition_date,a):!1;return`
        <div class="card" style="margin-bottom:var(--space-md)">
          <div style="display:flex;align-items:center;gap:var(--space-sm);margin-bottom:var(--space-sm)">
            <div class="avatar">${(e.first_name||"?")[0]}${(e.last_name||"?")[0]}</div>
            <h3 style="margin:0">${h(e.first_name||"Unnamed")} ${h(e.last_name||"Student")}</h3>
          </div>
          ${U(m,t,f)}
          <div class="${((v=g[e.id])==null?void 0:v.type)==="error"?"warning-box":((c=g[e.id])==null?void 0:c.type)==="success"?"success-box":"form-message"}" id="vocal-msg-${e.id}" aria-live="polite" style="${(u=g[e.id])!=null&&u.text?"margin:var(--space-sm) 0;padding:var(--space-sm) var(--space-md);border-radius:var(--radius-sm)":""}">${((p=g[e.id])==null?void 0:p.text)||""}</div>
          ${m.eligible?G(e,n,s,d,a):""}
        </div>
      `}).join("");i.innerHTML=`
    ${r}
    <p class="lock-time-notice">
      Changes are locked at <strong>${Y}</strong>. After that, only an admin can make changes.
    </p>
  `,J(i,o,n,s,l)}function U(i,o,n){return i.eligible?n?'<div class="locked-notice">🔒 Bookings are locked for this audition date. Contact an admin for changes.</div>':o?`
      <div class="success-box" style="margin:var(--space-sm) 0;padding:var(--space-sm) var(--space-md);border-radius:var(--radius-sm)">
        <p style="font-size:var(--text-small)">✓ Booked: <strong>${x(o.audition_date)}</strong>
        — ${y(o.start_time)} – ${y(o.end_time)}</p>
      </div>
    `:'<div class="placeholder-notice" style="margin:var(--space-sm) 0">Select a time slot below to book.</div>':`<div class="warning-box" style="margin:var(--space-sm) 0;padding:var(--space-sm) var(--space-md);border-radius:var(--radius-sm)"><p style="font-size:var(--text-small)">${i.reason}</p></div>`}function G(i,o,n,s,l){const a=s==null?void 0:s.audition_slot_id,r=!!s,e=b[i.id],m={};o.forEach(t=>{m[t.audition_date]||(m[t.audition_date]=[]),m[t.audition_date].push(t)});let d="";for(const[t,f]of Object.entries(m)){const v=E(t,l);d+=`<h4 style="margin-top:var(--space-md);font-size:var(--text-small);color:var(--color-text-secondary)">${x(t)}${v?' <span style="color:var(--color-error)">🔒 Locked</span>':""}</h4>`,f.forEach(c=>{const u=n[c.id]||0,p=F(u),S=c.id===a,C=c.id===e,L=!v&&(p.available||S),k=Math.min(u/A*100,100);let _="green";k>=100?_="full":k>=80?_="red":k>=60&&(_="amber");const M=`${p.spotsLeft}/${A} spots left`;let w="session-card";S||C?w="session-card selected":L||(w="session-card full"),d+=`
        <div class="${w}">
          <div class="session-info">
            <strong>${y(c.start_time)} – ${y(c.end_time)}</strong>
            <div class="capacity-bar" style="margin-top:var(--space-xs);max-width:200px"><div class="capacity-bar__fill capacity-bar__fill--${_}" style="width:${k}%"></div></div>
            <span style="font-size:var(--text-xs);color:var(--color-text-muted)">${M}</span>
          </div>
          <div class="session-actions">
            ${S?`<button class="btn-small btn-secondary cancel-btn" data-student="${i.id}" ${v?"disabled":""}>Cancel</button>`:`<button class="btn-small ${r?"reschedule-btn":"book-btn"}" data-student="${i.id}" data-slot="${c.id}" ${L?"":"disabled"}>${C?"✓ Selected":r?"Move Here":"Book"}</button>`}
          </div>
        </div>
      `})}if(e){const t=o.find(c=>c.id===e),f=`${y(t==null?void 0:t.start_time)} – ${y(t==null?void 0:t.end_time)}`,v=r?"Confirm Move":"Confirm Booking";d+=`
      <div class="booking-footer" style="margin-top:var(--space-md);border-radius:var(--radius-sm);position:relative">
        <div class="booking-footer__info">${r?"Move":"Book"} <strong>${h(i.first_name)}</strong> to <strong>${h(f)}</strong></div>
        <button class="btn-accent confirm-booking-btn" data-student="${i.id}" data-slot="${e}" data-action="${r?"reschedule":"book"}">${v}</button>
      </div>
    `}return d}function K(i,o){return new Promise(n=>{const s=document.createElement("div");s.className="confirm-dialog-backdrop",s.innerHTML=`
      <div class="confirm-dialog" role="alertdialog" aria-modal="true">
        <div class="confirm-dialog__title">${i}</div>
        <div class="confirm-dialog__message">${o}</div>
        <div class="confirm-dialog__actions">
          <button class="btn-ghost" data-action="cancel">Go Back</button>
          <button class="btn-primary" data-action="confirm">Confirm</button>
        </div>
      </div>
    `,s.querySelector('[data-action="confirm"]').addEventListener("click",()=>{s.remove(),n(!0)}),s.querySelector('[data-action="cancel"]').addEventListener("click",()=>{s.remove(),n(!1)}),s.addEventListener("click",l=>{l.target===s&&(s.remove(),n(!1))}),document.body.appendChild(s),s.querySelector('[data-action="confirm"]').focus()})}function J(i,o,n,s,l){i.querySelectorAll(".book-btn, .reschedule-btn").forEach(a=>{a.addEventListener("click",()=>{const r=a.dataset.student,e=a.dataset.slot;b[r]=e,$(i,o,n,s,l)})}),i.querySelectorAll(".confirm-booking-btn").forEach(a=>{a.addEventListener("click",async()=>{const r=a.dataset.student,e=a.dataset.slot,m=a.dataset.action;function d(t){g[r]={type:"error",text:t},delete b[r],$(i,o,n,s,l);const f=document.getElementById(`vocal-msg-${r}`);f&&f.scrollIntoView({behavior:"smooth",block:"nearest"})}delete g[r],a.disabled=!0,a.textContent=m==="reschedule"?"Moving…":"Booking…";try{const{error:t}=m==="reschedule"?await q(r,e):await R(r,e);if(t){d(t.message||"Booking failed. Please try again.");return}delete b[r],g[r]={type:"success",text:m==="reschedule"?"Rescheduled successfully.":"Booked successfully."},await B(i,o,n,l)}catch(t){d(t.message||"An unexpected error occurred. Please try again.")}})}),i.querySelectorAll(".cancel-btn").forEach(a=>{a.addEventListener("click",async()=>{if(!await K("Cancel Booking","Cancel this vocal booking? You may lose your spot."))return;const e=a.dataset.student;function m(d){g[e]={type:"error",text:d},$(i,o,n,s,l);const t=document.getElementById(`vocal-msg-${e}`);t&&t.scrollIntoView({behavior:"smooth",block:"nearest"})}delete g[e],a.disabled=!0,a.textContent="Cancelling…";try{const{error:d}=await z(e);if(d){m(d.message||"Failed to cancel. Please try again.");return}delete l[e],g[e]={type:"success",text:"Booking canceled."},await B(i,o,n,l)}catch(d){m(d.message||"An unexpected error occurred. Please try again.")}})})}async function B(i,o,n,s){await Promise.all(o.map(async a=>{const{data:r}=await V(a.id);r?s[a.id]=r:delete s[a.id]}));const{data:l}=await I();$(i,o,n,l||{},s)}export{se as renderFamilyVocalBooking};
