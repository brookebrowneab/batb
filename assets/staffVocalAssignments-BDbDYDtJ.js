import{g as H}from"./index-DB_Xnewy.js";import{e as y}from"./escapeHtml-lW1fV86Q.js";import{f as E}from"./scheduling-DSZ8OVmG.js";import{s as L,g as T,a as q}from"./rolePreferences-B9XCX_X4.js";import{v as z}from"./callbacks-C7GiSGW7.js";import{b as F,l as V,m as O,d as G,n as U,o as W,e as A,p as J,q as K}from"./rolePreferences-ETjakyug.js";import{f as Q}from"./scheduling-B2ki5TeN.js";import{a as M}from"./callbacks-B_fYK0Rj.js";import{a as X}from"./notifications-Dqi7YQoX.js";let _=[],v=[],B=[],C=[],R=[],k=[],b=new Set,S="";function pe(){const a=document.createElement("div");return a.className="page",a.innerHTML=`
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:var(--space-md)">
      <h1 style="margin:0">Vocal Day Assignments</h1>
      <button class="btn-ghost" onclick="location.hash='#/staff'" style="min-height:auto;width:auto">← Dashboard</button>
    </div>
    <div class="form-message" id="assign-msg" aria-live="polite"></div>
    <div id="assign-content"><p>Loading…</p></div>
  `,setTimeout(()=>$(),0),a}async function $(){const[a,t,s,r,g,l]=await Promise.all([F(),V(),O(),G(),Q(),M()]);_=a.data||[],k=t.data||[],v=s.data||[],B=r.data||[],C=g.data||[],R=l.data||[];const u=document.getElementById("assign-msg"),p=a.error||t.error||s.error||r.error||g.error||l.error;u&&p&&(u.className="form-message error",u.textContent=p.message||"Failed to load assignment data.");const e=new Map(B.map(n=>[n.student_id,n]));v=v.map(n=>({...n,day_assignment:e.get(n.id)||null})),w()}function w(){const a=document.getElementById("assign-content");if(!a)return;if(_.length===0){a.innerHTML=`
      <div class="placeholder-notice">
        No audition roles defined yet. <a href="#/staff/roles">Configure roles first</a>.
      </div>
    `;return}if(v.length===0){a.innerHTML='<div class="placeholder-notice">No registered students found.</div>';return}const t=C.map(r=>r.audition_date);if(t.length===0){a.innerHTML=`
      <div class="placeholder-notice">
        No audition dates configured. <a href="#/staff/scheduling">Set up scheduling first</a>.
      </div>
    `;return}let s="";s+=Y(t),s+=Z(),s+=ee(t),s+=te(t),s+=se(t),s+=ae(),s+=ne(),a.innerHTML=s,oe(a)}function j(a){var t;return((t=k.find(s=>s.audition_role_id===a))==null?void 0:t.audition_date)||""}function Y(a){const t=a.map(r=>`<option value="${r}">${E(r)}</option>`).join("");return`
    <div class="card" style="margin-bottom:var(--space-md);padding:var(--space-md)">
      <h2 style="margin-top:0">Role Day Mapping</h2>
      <p style="font-size:var(--text-small);color:var(--color-text-secondary);margin-bottom:var(--space-sm)">
        Assign each role to an audition day. Then auto-assign students by their #1 role preference.
      </p>
      <div id="role-day-mapping-list">${_.map(r=>(j(r.id),`
      <div style="display:flex;align-items:center;gap:var(--space-sm);padding:var(--space-xs) 0;border-bottom:1px solid var(--color-border-light)">
        <div style="min-width:180px"><strong>${y(r.name)}</strong></div>
        <select class="role-day-map-select" data-role-id="${r.id}" style="max-width:240px">
          <option value="">No day assigned</option>
          ${t}
        </select>
      </div>
    `)).join("")}</div>
      <div style="display:flex;gap:var(--space-sm);margin-top:var(--space-sm);flex-wrap:wrap">
        <button class="btn-small" id="save-role-day-mappings-btn">Save Role Days</button>
        <button class="btn-accent" id="auto-assign-role-days-btn">Auto-Assign by #1 Role</button>
      </div>
    </div>
  `}function Z(){return`
    <div style="display:flex;flex-wrap:wrap;gap:var(--space-sm);align-items:center;margin-bottom:var(--space-md)">
      <label for="filter-role" style="font-size:var(--text-small);font-weight:600">Filter by #1 role:</label>
      <select id="filter-role" style="max-width:200px">
        <option value="">All Students</option>
        ${_.map(t=>`<option value="${t.id}" ${S===t.id?"selected":""}>${y(t.name)}</option>`).join("")}
        <option value="__none__" ${S==="__none__"?"selected":""}>No Preference</option>
      </select>
    </div>
  `}function P(){if(!S)return v;const t=q(v,_).get(S);return t?t.students:[]}function ee(a){const t=P(),s=a.map(l=>`<option value="${l}">${E(l)}</option>`).join(""),r=t.length>0&&t.every(l=>b.has(l.id));let g=`
    <h2>Students (${t.length})</h2>
    <div class="table-responsive">
    <table class="data-table">
      <thead>
        <tr>
          <th class="checkbox-cell"><input type="checkbox" id="select-all-cb" ${r?"checked":""} /></th>
          <th>Name</th>
          <th>Grade</th>
          <th>#1 Role</th>
          <th>All Preferences</th>
          <th>Assigned Day</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
  `;return t.forEach(l=>{const u=L(l.role_preferences||[]),p=u[0],e=p?_.find(f=>f.id===p.audition_role_id):null,n=u.map(f=>{const d=_.find(c=>c.id===f.audition_role_id);return`${f.rank_order}. ${y((d==null?void 0:d.name)||"?")}`}).join(", ")||"—",o=l.day_assignment,i=o==null?void 0:o.audition_date,m=b.has(l.id)?"checked":"";g+=`
      <tr>
        <td class="checkbox-cell"><input type="checkbox" class="student-cb" data-id="${l.id}" ${m} /></td>
        <td><a href="#/staff/student-profile?id=${l.id}">${y(l.first_name||"")} ${y(l.last_name||"")}</a></td>
        <td>${y(l.grade||"—")}</td>
        <td>${e?y(e.name):'<span style="color:var(--color-text-muted)">—</span>'}</td>
        <td style="font-size:var(--text-xs)">${n}</td>
        <td>
          ${i?`<span class="badge active">${E(i)}</span>`:'<span style="color:var(--color-text-muted)">Unassigned</span>'}
        </td>
        <td>
          ${i?`<select class="reassign-select" data-student="${l.id}" style="width:auto;font-size:var(--text-xs)">
                <option value="">— Change —</option>
                ${s}
              </select>
              <button class="btn-small btn-secondary unassign-btn" data-student="${l.id}" style="margin-left:4px">Remove</button>`:`<select class="assign-select" data-student="${l.id}" style="width:auto;font-size:var(--text-xs)">
                <option value="">— Assign —</option>
                ${s}
              </select>`}
        </td>
      </tr>
    `}),g+="</tbody></table></div>",g}function te(a){if(b.size===0)return"";const t=a.map(s=>`<option value="${s}">${E(s)}</option>`).join("");return`
    <div class="bulk-action-bar">
      <span class="bulk-action-bar__count">${b.size} selected</span>
      <div class="bulk-action-bar__actions" style="display:flex;align-items:center;gap:var(--space-sm)">
        <select id="bulk-date-select" style="width:auto;font-size:var(--text-xs)">
          <option value="">— Select Date —</option>
          ${t}
        </select>
        <button class="btn-accent" id="bulk-assign-btn">Assign Selected</button>
      </div>
    </div>
  `}function se(a){let t='<h2 style="margin-top:var(--space-xl)">Assignment Summary</h2>';const s=v.filter(g=>g.day_assignment),r=v.filter(g=>!g.day_assignment);t+=`<p style="font-size:var(--text-small);color:var(--color-text-secondary);margin-bottom:var(--space-md)">
    <strong>${s.length}</strong> assigned, <strong>${r.length}</strong> unassigned of <strong>${v.length}</strong> total.
  </p>`,t+='<div style="display:grid;gap:var(--space-md);grid-template-columns:repeat(auto-fit,minmax(200px,1fr))">';for(const g of a){const l=s.filter(u=>{var p;return((p=u.day_assignment)==null?void 0:p.audition_date)===g});t+=`
      <div class="card" style="padding:var(--space-md)">
        <strong>${E(g)}</strong>
        <p style="font-size:var(--text-small);color:var(--color-text-secondary);margin:var(--space-xs) 0">${l.length} student${l.length!==1?"s":""}</p>
        ${l.length>0?`<ul style="margin:0;padding-left:1rem;font-size:var(--text-xs)">${l.map(u=>`<li>${y(u.first_name||"")} ${y(u.last_name||"")}</li>`).join("")}</ul>`:'<p style="font-size:var(--text-xs);color:var(--color-text-muted)">No students assigned</p>'}
      </div>
    `}return t+="</div>",t}function ae(){const a=v.filter(s=>s.day_assignment),t=a.filter(s=>z(s).valid);return`
    <div style="margin-top:var(--space-xl)">
      <h2>Send Notifications</h2>
      <p style="font-size:var(--text-small);color:var(--color-text-secondary);margin-bottom:var(--space-md)">
        Send day assignment emails to all assigned families with a parent email on file.
        <strong>${t.length}</strong> of <strong>${a.length}</strong> assigned students have email.
        <span style="color:var(--color-text-muted)">(Real email delivery via Resend)</span>
      </p>
      <button class="btn-primary" id="send-notifications-btn" ${t.length===0?"disabled":""}>
        Send All Notifications (${t.length})
      </button>
    </div>
  `}function ne(){const a=R.filter(s=>s.subject&&s.subject.includes("Vocal Audition Day"));let t='<h2 style="margin-top:var(--space-xl)">Notification History</h2>';return a.length===0?(t+='<p style="font-size:var(--text-small);color:var(--color-text-muted)">No day assignment notifications sent yet.</p>',t):(t+=`
    <div class="table-responsive">
    <table class="data-table">
      <thead>
        <tr>
          <th>Date Sent</th>
          <th>Student</th>
          <th>Recipient</th>
          <th>Subject</th>
        </tr>
      </thead>
      <tbody>
  `,a.forEach(s=>{const r=s.students,g=new Date(s.created_at).toLocaleString();t+=`
      <tr>
        <td style="font-size:var(--text-xs)">${y(g)}</td>
        <td>${y((r==null?void 0:r.first_name)||"")} ${y((r==null?void 0:r.last_name)||"")}</td>
        <td>${y(s.recipient_email)}</td>
        <td>${y(s.subject)}</td>
      </tr>
    `}),t+="</tbody></table></div>",t)}function oe(a,t){a.querySelectorAll(".role-day-map-select").forEach(e=>{const n=e.dataset.roleId;e.value=j(n)});const s=document.getElementById("save-role-day-mappings-btn");s&&s.addEventListener("click",async()=>{const{user:e}=H(),n=document.getElementById("assign-msg");if(!e)return;s.disabled=!0,s.textContent="Saving…";const o=[...document.querySelectorAll(".role-day-map-select")].map(async c=>{const h=c.dataset.roleId,x=c.value;return x?U(h,x,e.id):W(h)}),i=await Promise.allSettled(o),m=[];i.forEach(c=>{var h;if(c.status==="rejected"){m.push(c.reason);return}(h=c.value)!=null&&h.error&&m.push(c.value.error)});const f=m.length,d=m[0];s.disabled=!1,s.textContent="Save Role Days",n&&(f===0?(n.className="form-message success",n.textContent="Role day mappings saved."):(n.className="form-message error",n.textContent=d!=null&&d.message?`Failed to save role day mappings: ${d.message}`:`Saved with ${f} error(s).`)),await $()});const r=document.getElementById("auto-assign-role-days-btn");r&&r.addEventListener("click",async()=>{var f;const e=document.getElementById("assign-msg"),n=new Map(k.map(d=>[d.audition_role_id,d.audition_date]));if(n.size===0){e&&(e.className="form-message error",e.textContent="Set at least one role day mapping first.");return}r.disabled=!0,r.textContent="Assigning…";let o=0,i=0,m=0;for(const d of v){const h=(f=L(d.role_preferences||[])[0])==null?void 0:f.audition_role_id,x=h?n.get(h):null;if(!x){i++;continue}const{error:N}=await A(d.id,x);N?m++:o++}r.disabled=!1,r.textContent="Auto-Assign by #1 Role",e&&(m===0?(e.className="form-message success",e.textContent=`Auto-assigned ${o} student(s). Skipped ${i}.`):(e.className="form-message error",e.textContent=`Assigned ${o}, skipped ${i}, failed ${m}.`)),await $()});const g=document.getElementById("filter-role");g&&g.addEventListener("change",()=>{S=g.value,b.clear(),w()});const l=document.getElementById("select-all-cb");l&&l.addEventListener("change",()=>{const e=P();l.checked?e.forEach(n=>b.add(n.id)):e.forEach(n=>b.delete(n.id)),w()}),a.querySelectorAll(".student-cb").forEach(e=>{e.addEventListener("change",()=>{e.checked?b.add(e.dataset.id):b.delete(e.dataset.id),w()})}),a.querySelectorAll(".assign-select").forEach(e=>{e.addEventListener("change",async()=>{const n=e.dataset.student,o=e.value;if(!o)return;const i=document.getElementById("assign-msg");e.disabled=!0;const{error:m}=await A(n,o);if(m){i&&(i.className="form-message error",i.textContent=m.message||"Assignment failed."),e.disabled=!1,e.value="";return}i&&(i.className="form-message success",i.textContent="Student assigned."),await $()})}),a.querySelectorAll(".reassign-select").forEach(e=>{e.addEventListener("change",async()=>{const n=e.dataset.student,o=e.value;if(!o)return;const i=document.getElementById("assign-msg");e.disabled=!0;const{error:m}=await A(n,o);if(m){i&&(i.className="form-message error",i.textContent=m.message||"Reassignment failed."),e.disabled=!1,e.value="";return}i&&(i.className="form-message success",i.textContent="Student reassigned."),await $()})}),a.querySelectorAll(".unassign-btn").forEach(e=>{e.addEventListener("click",async()=>{const n=e.dataset.student;if(!window.confirm("Remove this student's day assignment?"))return;const o=document.getElementById("assign-msg");e.disabled=!0,e.textContent="Removing…";const{error:i}=await J(n);if(i){o&&(o.className="form-message error",o.textContent=i.message||"Failed to remove."),e.disabled=!1,e.textContent="Remove";return}o&&(o.className="form-message success",o.textContent="Assignment removed."),await $()})});const u=document.getElementById("bulk-assign-btn");u&&u.addEventListener("click",async()=>{const e=document.getElementById("bulk-date-select"),n=e==null?void 0:e.value;if(!n){const d=document.getElementById("assign-msg");d&&(d.className="form-message error",d.textContent="Please select a date first.");return}const o=document.getElementById("assign-msg");u.disabled=!0,u.textContent="Assigning…";const i=await Promise.allSettled([...b].map(d=>A(d,n))),m=i.filter(d=>d.status==="fulfilled"&&!d.value.error).length,f=i.length-m;b.clear(),o&&(f===0?(o.className="form-message success",o.textContent=`Assigned ${m} student(s) to ${E(n)}.`):(o.className="form-message error",o.textContent=`Assigned ${m}, failed ${f}. Check console.`)),await $()});const p=document.getElementById("send-notifications-btn");p&&p.addEventListener("click",async()=>{const e=document.getElementById("assign-msg"),o=v.filter(c=>c.day_assignment).filter(c=>z(c).valid);if(o.length===0){e&&(e.className="form-message error",e.textContent="No assigned students with email.");return}p.disabled=!0,p.textContent="Sending…",e&&(e.className="form-message",e.textContent="");const i=await Promise.allSettled(o.map(async c=>{const{subject:h,body:x,bodyPreview:N}=T(c,c.day_assignment.audition_date,C),{error:D}=await X({to:c.parent_email,subject:h,text:x});if(D)throw D;const{error:I}=await K(c.id,c.parent_email,h,N);if(I)throw I;return c.id})),m=i.filter(c=>c.status==="fulfilled").length,f=i.filter(c=>c.status==="rejected").length;p.disabled=!1,p.textContent=`Send All Notifications (${o.length})`,e&&(f===0?(e.className="form-message success",e.textContent=`Sent ${m} notification(s) successfully.`):(e.className="form-message error",e.textContent=`Sent ${m}, failed ${f}. Check console.`));const{data:d}=await M();R=d||[],w()})}export{pe as renderStaffVocalAssignments};
