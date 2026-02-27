import{g as p}from"./index-DAsUYhLQ.js";import{f as g,a as f,d as y}from"./contracts-B_TZzxq_.js";import{f as v}from"./students-BuanKS3Z.js";import{r as b,h,v as S}from"./sanitizeHtml-D1SfNnaG.js";import{e as d}from"./escapeHtml-lW1fV86Q.js";import"./purify.es-B9ZVCkUG.js";async function x(t){const[e,n]=await Promise.all([g(),v(t)]),a=e.data,r=n.data||[],c=await Promise.all(r.map(async s=>{const{data:i}=await f(s.id);return{...s,acceptances:i||[]}}));return{activeContract:a,students:c}}function $(t,e){if(h(t.acceptances,e.id)){const a=t.acceptances.find(r=>r.contract_id===e.id);return`
      <div class="card" style="margin-bottom:var(--space-md);border-left:4px solid var(--color-success)">
        <div class="acceptance-status success-box" style="margin:0">
          <div style="display:flex;align-items:center;gap:var(--space-sm);margin-bottom:var(--space-sm)">
            <span class="status-badge--complete">✓ Signed</span>
            <strong>${d(t.first_name||"this student")}</strong>
          </div>
          <p style="font-size:var(--text-small);color:var(--color-text-secondary)">Student: ${d(a.student_typed_signature)}</p>
          <p style="font-size:var(--text-small);color:var(--color-text-secondary)">Parent: ${d(a.parent_typed_signature)}</p>
          <p style="font-size:var(--text-small);color:var(--color-text-muted)">Signed: ${new Date(a.created_at).toLocaleString()}</p>
        </div>
      </div>
    `}return`
    <div class="card" style="margin-bottom:var(--space-md)">
      <form class="signing-form login-form" data-student-id="${t.id}" data-contract-id="${e.id}" style="margin:0;padding:0;border:none;max-width:100%">
        <h3 style="margin-bottom:var(--space-md)">Sign for ${d(t.first_name||"Student")} ${d(t.last_name||"")}</h3>
        <label>
          <input type="checkbox" class="agree-checkbox" style="margin-right:var(--space-sm)" />
          I have read and agree to the terms above
        </label>
        <label for="student-sig-${t.id}">Student Typed Signature</label>
        <input type="text" id="student-sig-${t.id}" required placeholder="Type student's full name" disabled />
        <label for="parent-sig-${t.id}">Parent/Guardian Typed Signature</label>
        <input type="text" id="parent-sig-${t.id}" required placeholder="Type parent/guardian's full name" disabled />
        <button type="submit" class="btn-accent" disabled>Sign & Complete</button>
        <div class="form-message" data-msg-student="${t.id}" aria-live="polite"></div>
      </form>
    </div>
  `}function C(t){document.querySelectorAll(".agree-checkbox").forEach(e=>{e.addEventListener("change",()=>{const n=e.closest(".signing-form"),a=n.querySelectorAll('input[type="text"]'),r=n.querySelector('button[type="submit"]');a.forEach(s=>{s.disabled=!e.checked});function c(){const s=Array.from(a).every(i=>i.value.trim());r.disabled=!(e.checked&&s)}c(),a.forEach(s=>s.addEventListener("input",c))})}),document.querySelectorAll(".signing-form").forEach(e=>{e.addEventListener("submit",async n=>{n.preventDefault();const a=e.getAttribute("data-student-id"),r=e.getAttribute("data-contract-id"),c=document.getElementById(`student-sig-${a}`).value.trim(),s=document.getElementById(`parent-sig-${a}`).value.trim(),i=document.querySelector(`[data-msg-student="${a}"]`),o=e.querySelector("button"),{valid:m,errors:u}=S(c,s);if(!m){i.textContent=u.join(" "),i.className="form-message error";return}o.disabled=!0,o.textContent="Signing…",i.textContent="";const{error:l}=await y({studentId:a,contractId:r,studentTypedSignature:c,parentTypedSignature:s,signedByUserId:t});if(l){i.textContent="Failed to sign: "+l.message,i.className="form-message error",o.disabled=!1,o.textContent="Sign & Complete";return}i.textContent="Contract signed successfully! 🌹",i.className="form-message success",o.disabled=!0,o.textContent="Signed ✓"})})}function w(){const t=document.createElement("div");return t.className="page",t.innerHTML=`
    <p><a href="#/family">← Back to Dashboard</a></p>
    <h1>Contract 📋</h1>
    <div id="contract-content"><p>Loading…</p></div>
  `,setTimeout(async()=>{const{user:e}=p();if(!e)return;const{activeContract:n,students:a}=await x(e.id),r=document.getElementById("contract-content");if(r){if(!n){r.innerHTML=`
        <div class="placeholder-notice">
          No contract is available at this time. Please check back later.
        </div>
      `;return}if(a.length===0){r.innerHTML=`
        <div class="placeholder-notice">
          No students registered yet. Please <a href="#/family/register">complete student registration</a> first.
        </div>
      `;return}r.innerHTML=`
      <h2>Contract (v${n.version_number})</h2>
      <div class="contract-text">${b(n.text_snapshot)}</div>
      <hr>
      <h2>Signatures</h2>
      <p style="font-size:var(--text-small);color:var(--color-text-secondary);margin-bottom:var(--space-md)">
        Please read the contract above, then sign for each student below.
      </p>
      ${a.map(c=>$(c,n)).join("")}
    `,C(e.id)}},0),t}export{w as renderFamilyContract};
