import{f as m,a as c}from"./scheduling-DSZ8OVmG.js";import{e as f}from"./escapeHtml-lW1fV86Q.js";import{f as h,a as y}from"./evaluations-CxT3uzxn.js";import{c as g,e as x,a as E}from"./rateLimiting-qhWdY3rT.js";import"./index-DAsUYhLQ.js";import"./vocalBookings-C9_XrrUc.js";import"./callbacks-DKx8uzUx.js";import"./students-BuanKS3Z.js";import"./storage-C5gVaxsf.js";const C=g(x),$=g(E);let i=[],p=[],l="";function T(){const n=document.createElement("div");return n.className="page",n.innerHTML=`
    <h1>Dance Roster 🎵</h1>
    <div id="dance-roster-actions" style="margin-bottom:var(--space-md)"></div>
    <div class="form-message" id="roster-msg" aria-live="polite"></div>
    <div id="dance-roster-content"><p>Loading…</p></div>
  `,setTimeout(()=>D(),0),n}async function D(){const[n,r]=await Promise.all([h(),y()]);i=n.data||[],p=r.data||[],_(),u()}function _(){var r,a;const n=document.getElementById("dance-roster-actions");n&&(n.innerHTML=`
    <div style="display:flex;flex-wrap:wrap;gap:var(--space-sm);align-items:center">
      <button class="btn-small" id="export-dance-pdf-btn">📄 PDF</button>
      <button class="btn-small btn-secondary" id="export-dance-csv-btn">📊 CSV</button>
      <span style="font-size:var(--text-xs);color:var(--color-text-muted)">Dance roster is auto-assigned from scheduling config.</span>
    </div>
  `,(r=document.getElementById("export-dance-pdf-btn"))==null||r.addEventListener("click",async d=>{const t=d.target,e=document.getElementById("roster-msg");t.disabled=!0,t.textContent="Generating…",e&&(e.className="form-message",e.textContent="");try{await C(),e&&(e.className="form-message success",e.textContent="PDF downloaded.")}catch(o){e&&(e.className="form-message error",e.textContent=o.message||"Export failed.")}t.disabled=!1,t.textContent="📄 PDF"}),(a=document.getElementById("export-dance-csv-btn"))==null||a.addEventListener("click",async d=>{const t=d.target,e=document.getElementById("roster-msg");t.disabled=!0,t.textContent="Exporting…";try{await $(),e&&(e.className="form-message success",e.textContent="CSV downloaded.")}catch(o){e&&(e.className="form-message error",e.textContent=o.message||"Export failed.")}t.disabled=!1,t.textContent="📊 CSV"}))}function u(){const n=document.getElementById("dance-roster-content");if(!n)return;if(i.length===0){n.innerHTML='<div class="placeholder-notice">No dance windows configured yet. Set dance times in Scheduling.</div>';return}const r=[...new Set(i.map(t=>t.audition_date))].sort();let a='<div style="margin-bottom:var(--space-md)"><label for="dance-date-filter" style="margin-right:var(--space-sm);font-weight:600;font-size:var(--text-small)">Filter by date:</label>';a+='<select id="dance-date-filter" style="padding:0.5rem 0.75rem;border:1px solid var(--color-border);border-radius:var(--radius-sm);font-family:var(--font-body);font-size:var(--text-small)">',a+='<option value="">All dates</option>',r.forEach(t=>{a+=`<option value="${t}" ${l===t?"selected":""}>${m(t)}</option>`}),a+="</select></div>";const d=l?i.filter(t=>t.audition_date===l):i;a+=`
    <div class="table-responsive">
    <table class="data-table">
      <thead>
        <tr>
          <th>Date</th>
          <th>Dance Window</th>
          <th>Assigned Students</th>
        </tr>
      </thead>
      <tbody>
  `,d.forEach(t=>{const e=p.filter(o=>o.dance_window_id===t.id);a+=`
      <tr>
        <td>${m(t.audition_date)}</td>
        <td>${c(t.start_time)} – ${c(t.end_time)}</td>
        <td>${e.length}</td>
      </tr>
    `}),a+="</tbody></table></div>",a+='<h2 style="margin-top:var(--space-xl)">Attendees by Dance Window</h2>',d.forEach(t=>{const e=p.filter(o=>o.dance_window_id===t.id);a+=`<h3 style="margin-top:var(--space-md)">${m(t.audition_date)} — ${c(t.start_time)} – ${c(t.end_time)}</h3>`,e.length===0?a+='<p style="font-size:var(--text-small);color:var(--color-text-muted);margin-bottom:var(--space-sm)">No assigned students yet.</p>':(a+='<table class="data-table"><thead><tr><th>#</th><th>Student</th><th>Grade</th></tr></thead><tbody>',e.forEach((o,v)=>{const s=o.students,b=`#/staff/student-profile?id=${(s==null?void 0:s.id)||""}`;a+=`<tr><td>${v+1}</td><td><a href="${b}">${f((s==null?void 0:s.first_name)||"")} ${f((s==null?void 0:s.last_name)||"")}</a></td><td>${f((s==null?void 0:s.grade)||"—")}</td></tr>`}),a+="</tbody></table>")}),n.innerHTML=a,S()}function S(n){const r=document.getElementById("dance-date-filter");r&&r.addEventListener("change",()=>{l=r.value,u()})}export{T as renderStaffDanceRoster};
