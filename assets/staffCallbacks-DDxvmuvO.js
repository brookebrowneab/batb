import{e as m}from"./escapeHtml-lW1fV86Q.js";import{f as L,a as E}from"./scheduling-DSZ8OVmG.js";import{i as x,v as S,g as w}from"./callbacks-C7GiSGW7.js";import{f as R,a as C,l as $,t as k}from"./callbacks-D2zPUgBz.js";import{a as N}from"./notifications-BdH-EGaZ.js";import{f as P}from"./scheduling-CaKXSNop.js";import{c as I,f as A,g as F}from"./rateLimiting-_sPYf2e0.js";import"./index-DpHEjNAw.js";import"./evaluations-ZlecxDBL.js";import"./vocalBookings-DrPs_CCY.js";import"./students-B2nRX23A.js";import"./storage-DrT2NRiX.js";const H=I(A),z=I(F);let f=[],p=[],v=[],r=new Set;function nt(){const s=document.createElement("div");return s.className="page",s.innerHTML=`
    <h1>Callback Management ⭐</h1>
    <div id="callback-actions" style="margin-bottom:var(--space-md)"></div>
    <div class="form-message" id="callback-msg" aria-live="polite"></div>
    <div id="callback-content"><p>Loading…</p></div>
  `,setTimeout(()=>h(),0),s}async function h(){const[s,e,a]=await Promise.all([R(),P(),C()]);f=s.data||[],p=e.data||[],v=a.data||[],T(),g()}function T(){var c,t,l;const s=document.getElementById("callback-actions");if(!s)return;const e=f.filter(o=>x(o)).length,a=f.length;s.innerHTML=`
    <div style="display:flex;flex-wrap:wrap;gap:var(--space-sm);align-items:center;margin-bottom:var(--space-sm)">
      <button class="btn-primary" id="send-all-btn">Send Notifications</button>
      <button class="btn-small" id="export-callbacks-pdf-btn">📄 Full Pack PDF</button>
      <button class="btn-small btn-secondary" id="export-callbacks-csv-btn">📊 CSV</button>
    </div>
    <p style="font-size:var(--text-small);color:var(--color-text-secondary)">
      <strong>${e}</strong> of <strong>${a}</strong> students invited to callbacks.
      <span style="color:var(--color-text-muted)">(Real email delivery via Resend)</span>
    </p>
  `,(c=document.getElementById("send-all-btn"))==null||c.addEventListener("click",D),(t=document.getElementById("export-callbacks-pdf-btn"))==null||t.addEventListener("click",async o=>{const n=o.target,i=document.getElementById("callback-msg");n.disabled=!0,n.textContent="Generating…",i&&(i.className="form-message",i.textContent="");try{await H(),i&&(i.className="form-message success",i.textContent="PDF downloaded.")}catch(d){i&&(i.className="form-message error",i.textContent=d.message||"Export failed.")}n.disabled=!1,n.textContent="📄 Full Pack PDF"}),(l=document.getElementById("export-callbacks-csv-btn"))==null||l.addEventListener("click",async o=>{const n=o.target,i=document.getElementById("callback-msg");n.disabled=!0,n.textContent="Exporting…";try{await z(),i&&(i.className="form-message success",i.textContent="CSV downloaded.")}catch(d){i&&(i.className="form-message error",i.textContent=d.message||"Export failed.")}n.disabled=!1,n.textContent="📊 CSV"})}async function D(){const s=document.getElementById("send-all-btn"),e=document.getElementById("callback-msg");if(!s)return;const a=f.filter(n=>x(n)&&S(n).valid);if(a.length===0){e&&(e.className="form-message error",e.textContent="No invited students with parent email on file.");return}s.disabled=!0,s.textContent="Sending…",e&&(e.className="form-message",e.textContent="");const c=await Promise.allSettled(a.map(async n=>{const{subject:i,body:d,bodyPreview:y}=w(n,p),{error:u}=await N({to:n.parent_email,subject:i,text:d});if(u)throw u;const{error:b}=await $(n.id,n.parent_email,i,y);if(b)throw b;return n.id})),t=c.filter(n=>n.status==="fulfilled").length,l=c.filter(n=>n.status==="rejected").length;s.disabled=!1,s.textContent="Send Notifications",e&&(l===0?(e.className="form-message success",e.textContent=`Sent ${t} notification(s) successfully.`):(e.className="form-message error",e.textContent=`Sent ${t}, failed ${l}. Check console for details.`));const{data:o}=await C();v=o||[],g()}function g(){const s=document.getElementById("callback-content");if(!s)return;if(f.length===0){s.innerHTML='<div class="placeholder-notice">No students registered yet.</div>';return}let e=j();e+=M(),e+=U(),e+=q(),s.innerHTML=e,G(s)}function j(){let e=`
    <h2>Students</h2>
    <div class="table-responsive">
    <table class="data-table">
      <thead>
        <tr>
          <th class="checkbox-cell"><input type="checkbox" id="select-all-cb" ${f.length>0&&r.size===f.length?"checked":""} /></th>
          <th>#</th>
          <th>Name</th>
          <th>Grade</th>
          <th>Registration</th>
          <th>Invited</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
  `;return f.forEach((a,c)=>{const t=x(a),l=S(a),o=a.registration_complete?"✓ Complete":"⏳ Incomplete",n=a.registration_complete?"color:var(--color-success)":"color:var(--color-error)",i=r.has(a.id)?"checked":"";e+=`
      <tr>
        <td class="checkbox-cell"><input type="checkbox" class="student-cb" data-id="${a.id}" ${i} /></td>
        <td>${c+1}</td>
        <td><a href="#/staff/student-profile?id=${a.id}">${m(a.first_name||"")} ${m(a.last_name||"")}</a></td>
        <td>${m(a.grade||"—")}</td>
        <td style="${n};font-size:var(--text-small)">${o}</td>
        <td>
          <button class="btn-small ${t?"btn-secondary":""} invite-toggle-btn"
                  data-id="${a.id}" data-invited="${t}">
            ${t?"Uninvite":"Invite"}
          </button>
        </td>
        <td>
          <button class="btn-small send-one-btn"
                  data-id="${a.id}"
                  ${!t||!l.valid?"disabled":""}
                  title="${t?l.valid?"Send notification":l.reason:"Not invited"}">
            Send
          </button>
        </td>
      </tr>
    `}),e+="</tbody></table></div>",e}function M(){return r.size===0?"":`
    <div class="bulk-action-bar">
      <span class="bulk-action-bar__count">${r.size} selected</span>
      <div class="bulk-action-bar__actions">
        <button class="btn-accent" id="bulk-invite-btn">Invite Selected (${r.size})</button>
        <button class="btn-ghost" id="bulk-uninvite-btn" style="color:var(--color-surface);border-color:hsla(0,0%,100%,0.3)">Uninvite Selected</button>
      </div>
    </div>
  `}function U(){const s=p.filter(a=>a.callback_start_time&&a.callback_end_time);if(s.length===0)return'<p style="margin-top:var(--space-lg);font-size:var(--text-small);color:var(--color-text-muted)">No callback windows configured yet. Set them in <a href="#/staff/scheduling">Scheduling</a>.</p>';let e='<h2 style="margin-top:var(--space-xl)">Callback Windows</h2>';return e+='<table class="data-table"><thead><tr><th>Date</th><th>Start</th><th>End</th></tr></thead><tbody>',s.forEach(a=>{e+=`<tr><td>${L(a.audition_date)}</td><td>${E(a.callback_start_time)}</td><td>${E(a.callback_end_time)}</td></tr>`}),e+="</tbody></table>",e}function q(){let s='<h2 style="margin-top:var(--space-xl)">Notification History</h2>';return v.length===0?(s+='<p style="font-size:var(--text-small);color:var(--color-text-muted)">No notifications sent yet.</p>',s):(s+=`
    <table class="data-table">
      <thead>
        <tr>
          <th>Date</th>
          <th>Student</th>
          <th>Recipient</th>
          <th>Subject</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
  `,v.forEach(e=>{const a=e.students,c=new Date(e.created_at).toLocaleString();s+=`
      <tr>
        <td style="font-size:var(--text-xs)">${m(c)}</td>
        <td>${m((a==null?void 0:a.first_name)||"")} ${m((a==null?void 0:a.last_name)||"")}</td>
        <td>${m(e.recipient_email)}</td>
        <td>${m(e.subject)}</td>
        <td><span class="status-badge--complete">${m(e.status)}</span></td>
      </tr>
    `}),s+="</tbody></table>",s)}function G(s){const e=document.getElementById("select-all-cb");e&&e.addEventListener("change",()=>{e.checked?f.forEach(t=>r.add(t.id)):r.clear(),g()}),s.querySelectorAll(".student-cb").forEach(t=>{t.addEventListener("change",()=>{t.checked?r.add(t.dataset.id):r.delete(t.dataset.id),g()})});const a=document.getElementById("bulk-invite-btn");a&&a.addEventListener("click",async()=>{const t=document.getElementById("callback-msg");a.disabled=!0,a.textContent="Inviting…";for(const l of r)await k(l,!0);r.clear(),t&&(t.className="form-message success",t.textContent="Selected students invited."),await h()});const c=document.getElementById("bulk-uninvite-btn");c&&c.addEventListener("click",async()=>{const t=document.getElementById("callback-msg");c.disabled=!0,c.textContent="Removing…";for(const l of r)await k(l,!1);r.clear(),t&&(t.className="form-message success",t.textContent="Invites removed for selected students."),await h()}),s.querySelectorAll(".invite-toggle-btn").forEach(t=>{t.addEventListener("click",async()=>{const l=t.dataset.id,o=t.dataset.invited==="true",n=!o;if(o&&!window.confirm("Remove this student's callback invite?"))return;const i=document.getElementById("callback-msg");t.disabled=!0,t.textContent=n?"Inviting…":"Removing…";const{error:d}=await k(l,n);if(d){t.disabled=!1,t.textContent=o?"Uninvite":"Invite",i&&(i.className="form-message error",i.textContent=d.message||"Failed to update invite.");return}i&&(i.className="form-message success",i.textContent=n?"Student invited.":"Invite removed."),await h()})}),s.querySelectorAll(".send-one-btn").forEach(t=>{t.addEventListener("click",async()=>{const l=t.dataset.id,o=f.find(B=>B.id===l);if(!o)return;const n=document.getElementById("callback-msg");t.disabled=!0,t.textContent="Sending…";const{subject:i,body:d,bodyPreview:y}=w(o,p),{error:u}=await N({to:o.parent_email,subject:i,text:d});if(u){t.disabled=!1,t.textContent="Send",n&&(n.className="form-message error",n.textContent=u.message||"Failed to send notification.");return}const{error:b}=await $(o.id,o.parent_email,i,y);if(b){t.disabled=!1,t.textContent="Send",n&&(n.className="form-message error",n.textContent=b.message||"Failed to log notification.");return}n&&(n.className="form-message success",n.textContent=`Notification sent to ${m(o.parent_email)}.`);const{data:_}=await C();v=_||[],g()})})}export{nt as renderStaffCallbacks};
