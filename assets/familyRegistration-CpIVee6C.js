import{g as U}from"./index-CISvQlxv.js";import{f as D,d as j,u as P,c as H}from"./students-BzgHTSjC.js";import{f as F,a as z,d as G}from"./contracts-Ccb3_VRS.js";import{g as M,u as O,a as W}from"./storage-ChXrR-oM.js";import{v as Y,h as J,r as V}from"./sanitizeHtml-D1SfNnaG.js";import{v as K,e as L}from"./registration-BJf__55_.js";import{i as Q}from"./emailValidation-DoK9MuSU.js";import{e as i}from"./escapeHtml-lW1fV86Q.js";import{f as X,b as Z,c as ee,s as te}from"./rolePreferences-fmduO-w7.js";import{v as ne,i as ae,s as q}from"./rolePreferences-B9XCX_X4.js";import{s as se}from"./notifications-CxSKOM9h.js";import"./purify.es-B9ZVCkUG.js";import"./scheduling-DSZ8OVmG.js";let w=[],t=null,S=[],h=null,u=1,A=null,E=[],$=[];function re(){const e=window.location.hash||"",n=e.indexOf("?");return n===-1?null:new URLSearchParams(e.slice(n+1)).get("studentId")||null}function N(){return E.length>0&&ae(A)}function T(){const e=["Student Info","Parent/Guardian","Audition Song","Photo"];return N()&&e.push("Role Preferences"),e.push("Review & Sign"),e}async function oe(e,n=null,r=!1){const[o,m,p,g]=await Promise.all([D(e),F(),X(),Z()]);if(w=o.data||[],h=m.data,A=p.data,E=g.data||[],r?t=null:n?t=w.find(y=>y.id===n)||null:w.length>0?t=w[0]:t=null,t){const[y,_]=await Promise.all([z(t.id),N()?ee(t.id):{data:[]}]);S=y.data||[],$=_.data||[]}else S=[],$=[]}function ie(){const e=T();let n='<div class="wizard-progress">';for(let r=1;r<=e.length;r++){r>1&&(n+=`<div class="wizard-progress__connector${r<=u?" wizard-progress__connector--complete":""}"></div>`);let o="wizard-progress__dot",m=String(r);r<u?(o+=" wizard-progress__dot--complete",m="✓"):r===u&&(o+=" wizard-progress__dot--active"),n+=`<div class="wizard-progress__step"><div class="${o}">${m}</div><span class="${r===u?"wizard-progress__label wizard-progress__label--active":"wizard-progress__label"}">${e[r-1]}</span></div>`}return n+="</div>",n}function le(){let e="";if(w.length>1){const n=w.map(r=>{const o=t&&r.id===t.id?"selected":"";return`<option value="${r.id}" ${o}>${i(r.first_name||"Unnamed")} ${i(r.last_name||"Student")}</option>`}).join("");e+=`<div class="student-selector"><label for="student-select"><strong>Student:</strong></label><select id="student-select">${n}</select></div>`}return w.length>=1&&(e+=`
      <div style="display:flex;gap:var(--space-sm);flex-wrap:wrap;margin-bottom:var(--space-md)">
        <button id="add-student-btn" class="btn-small">+ Add Another Student</button>
        ${t?'<button id="clear-registration-btn" class="btn-small btn-secondary">Clear This Registration</button>':""}
      </div>
    `),e}function de(){const e=L(t,S,(h==null?void 0:h.id)||null);return e.complete?'<div class="enchanted-banner" style="margin-bottom:var(--space-md)"><div class="enchanted-banner__icon">🌹</div><div class="enchanted-banner__content"><div class="enchanted-banner__title">Registration Complete!</div><div class="enchanted-banner__message">All requirements are met. Dance and vocal schedules are assigned by staff.</div><a class="enchanted-banner__link" href="#/family/schedule">View schedule →</a></div></div>':`<div class="warning-box student-card" style="margin-bottom:var(--space-md)"><strong>Registration Incomplete</strong><p style="margin-top:var(--space-xs)">Still needed:</p><ul style="margin:0.25rem 0 0 1.25rem;padding:0">${e.missing.map(n=>`<li>${n}</li>`).join("")}</ul></div>`}function ce(){return t&&(t.parent_first_name||t.parent_email)?t:w.find(n=>n.parent_first_name||n.parent_email)||t||{}}function me(){const e=t||{};return`
    <div class="card">
      <h2>Student Information</h2>
      <p style="font-size:var(--text-small);color:var(--color-text-secondary);margin-bottom:var(--space-md)">Enter the student's basic details.</p>
      <form id="student-form" class="login-form" style="max-width:100%">
        <label for="reg-first-name">First Name *</label>
        <input type="text" id="reg-first-name" required value="${i(e.first_name||"")}" />
        <label for="reg-last-name">Last Name *</label>
        <input type="text" id="reg-last-name" required value="${i(e.last_name||"")}" />
        <label for="reg-grade">Grade *</label>
        <input type="text" id="reg-grade" required value="${i(e.grade||"")}" placeholder="e.g. 5, 6, 7" />
        <label for="reg-student-email">Student Email (optional)</label>
        <input type="email" id="reg-student-email" value="${i(e.student_email||"")}" placeholder="student@example.com" />
        <button type="submit" class="btn-accent">Save & Continue</button>
        <div id="student-form-msg" class="form-message" aria-live="polite"></div>
      </form>
    </div>
  `}function pe(){if(!t)return'<div class="card"><h2>Parent/Guardian Information</h2><p class="placeholder-notice">Complete student info first.</p></div>';const e=ce();return`
    <div class="card">
      <h2>Parent/Guardian Information</h2>
      <p style="font-size:var(--text-small);color:var(--color-text-secondary);margin-bottom:var(--space-md)">This information is used for communication and day-of logistics.</p>
      <form id="parent-form" class="login-form" style="max-width:100%">
        <label for="reg-parent-first">First Name *</label>
        <input type="text" id="reg-parent-first" required value="${i(e.parent_first_name||"")}" />
        <label for="reg-parent-last">Last Name *</label>
        <input type="text" id="reg-parent-last" required value="${i(e.parent_last_name||"")}" />
        <label for="reg-parent-email">Email *</label>
        <input type="email" id="reg-parent-email" required value="${i(e.parent_email||"")}" />
        <label for="reg-parent-phone">Phone *</label>
        <input type="tel" id="reg-parent-phone" required value="${i(e.parent_phone||"")}" placeholder="(555) 123-4567" />

        <div style="margin-top:var(--space-md);padding-top:var(--space-md);border-top:1px solid var(--color-border-light)">
          <label style="display:flex;align-items:center;gap:var(--space-sm);cursor:pointer">
            <input type="checkbox" id="reg-show-parent2" ${e.parent2_first_name||e.parent2_email?"checked":""} />
            Add second parent/guardian (optional)
          </label>
        </div>
        <div id="parent2-fields" style="display:${e.parent2_first_name||e.parent2_email?"block":"none"};margin-top:var(--space-sm)">
          <label for="reg-parent2-first">First Name</label>
          <input type="text" id="reg-parent2-first" value="${i(e.parent2_first_name||"")}" />
          <label for="reg-parent2-last">Last Name</label>
          <input type="text" id="reg-parent2-last" value="${i(e.parent2_last_name||"")}" />
          <label for="reg-parent2-email">Email</label>
          <input type="email" id="reg-parent2-email" value="${i(e.parent2_email||"")}" />
          <label for="reg-parent2-phone">Phone</label>
          <input type="tel" id="reg-parent2-phone" value="${i(e.parent2_phone||"")}" placeholder="(555) 123-4567" />
        </div>

        <button type="submit" class="btn-accent">Save & Continue</button>
        <div id="parent-form-msg" class="form-message" aria-live="polite"></div>
      </form>
    </div>
  `}function ue(){if(!t)return'<div class="card"><h2>Audition Song</h2><p class="placeholder-notice">Complete student info first.</p></div>';const e=t,n=e.sings_own_disney_song||!1;return`
    <div class="card">
      <h2>Audition Song</h2>
      <p style="font-size:var(--text-small);color:var(--color-text-secondary);margin-bottom:var(--space-md)">
        Will this student sing their own Disney song for the vocal audition?
      </p>
      <form id="song-form" class="login-form" style="max-width:100%">
        <div style="display:flex;gap:var(--space-lg);margin-bottom:var(--space-md)">
          <label style="display:flex;align-items:center;gap:var(--space-xs);cursor:pointer">
            <input type="radio" name="sings-own" value="yes" ${n?"checked":""} /> Yes
          </label>
          <label style="display:flex;align-items:center;gap:var(--space-xs);cursor:pointer">
            <input type="radio" name="sings-own" value="no" ${n?"":"checked"} /> No
          </label>
        </div>
        <div id="song-name-field" style="display:${n?"block":"none"}">
          <label for="reg-song-name">Song Name *</label>
          <input type="text" id="reg-song-name" value="${i(e.song_name||"")}" placeholder="e.g. Part of Your World" />
        </div>
        <button type="submit" class="btn-accent">Save & Continue</button>
        <div id="song-form-msg" class="form-message" aria-live="polite"></div>
      </form>
    </div>
  `}function ge(){if(!t)return'<div class="card"><h2>Student Photo</h2><p class="placeholder-notice">Complete student info first.</p></div>';const e=t.photo_storage_path;return`
    <div class="card">
      <h2>Student Photo</h2>
      <p style="font-size:var(--text-small);color:var(--color-text-secondary);margin-bottom:var(--space-md)">
        Upload a clear headshot photo of the student. This will be included in staff materials.
      </p>
      ${e?'<p class="form-message success" style="margin-bottom:var(--space-sm)">✓ Photo uploaded. You can replace it below.</p>':""}
      <div id="photo-preview" style="margin-bottom:var(--space-md)"></div>
      <form id="photo-form" class="login-form" style="max-width:100%">
        <input type="file" id="reg-photo" accept="image/*" ${e?"":"required"} />
        <button type="submit" class="btn-accent">${e?"Replace & Continue":"Upload & Continue"}</button>
        <div id="photo-form-msg" class="form-message" aria-live="polite"></div>
      </form>
      ${e?'<button class="btn-ghost skip-step-btn" style="margin-top:var(--space-sm);width:100%">Skip — keep current photo</button>':""}
    </div>
  `}function fe(){if(!t)return'<div class="card"><h2>Role Preferences</h2><p class="placeholder-notice">Complete student info first.</p></div>';const e=q($),n=new Map(e.map(p=>[p.audition_role_id,p.rank_order])),r=E.map((p,g)=>g+1);let o=E.map(p=>{const g=n.get(p.id)||"",y=r.map(_=>`<option value="${_}" ${g===_?"selected":""}>${_}</option>`).join("");return`
      <div class="role-pref-row" style="display:flex;align-items:center;gap:var(--space-sm);padding:var(--space-sm) 0;border-bottom:1px solid var(--color-border)">
        <div style="flex:1"><strong>${i(p.name)}</strong></div>
        <select class="role-rank-select" data-role-id="${p.id}" style="width:80px">
          <option value="">—</option>
          ${y}
        </select>
      </div>
    `}).join("");return`
    <div class="card">
      <h2>Role Preferences</h2>
      <p style="font-size:var(--text-small);color:var(--color-text-secondary);margin-bottom:var(--space-md)">
        Rank the roles your student would like to audition for. This helps the director assign audition days.
        This step is optional — you can skip it if you're unsure.
      </p>
      ${e.length>0?'<p class="form-message success" style="margin-bottom:var(--space-sm)">✓ Preferences saved.</p>':""}
      <div id="role-prefs-list" style="margin-bottom:var(--space-md)">
        ${o}
      </div>
      <button id="save-role-prefs-btn" class="btn-accent" style="width:100%">Save & Continue</button>
      <button id="skip-role-prefs-btn" class="btn-ghost" style="margin-top:var(--space-sm);width:100%">Skip — no preference</button>
      <div id="role-prefs-msg" class="form-message" aria-live="polite"></div>
    </div>
  `}function ve(){if(!t)return'<div class="card"><h2>Review & Sign</h2><p class="placeholder-notice">Complete previous steps first.</p></div>';const e=t,n=h&&J(S,h.id);let r="";if(!h)r='<p class="placeholder-notice" style="margin-top:var(--space-md)">No contract available.</p>';else if(n){const o=S.find(m=>m.contract_id===h.id);r=`
      <div class="success-box" style="padding:var(--space-md);border-radius:var(--radius-sm);margin-top:var(--space-lg)">
        <strong>✓ Contract signed!</strong>
        <p style="font-size:var(--text-small)">Student: ${i(o.student_typed_signature)}</p>
        <p style="font-size:var(--text-small)">Parent: ${i(o.parent_typed_signature)}</p>
        <p style="font-size:var(--text-small);color:var(--color-text-muted)">Signed: ${new Date(o.created_at).toLocaleString()}</p>
      </div>
    `}else r=`
      <div style="margin-top:var(--space-lg)">
        <h3>Contract (v${h.version_number})</h3>
        <div class="contract-text">${V(h.text_snapshot)}</div>
        <form id="contract-form" class="login-form" style="max-width:100%;margin-top:var(--space-md)">
          <label for="reg-student-sig">Student Typed Signature *</label>
          <input type="text" id="reg-student-sig" required placeholder="Type student's full name" />
          <label for="reg-parent-sig">Parent/Guardian Typed Signature *</label>
          <input type="text" id="reg-parent-sig" required placeholder="Type parent/guardian's full name" />
          <button type="submit" class="btn-accent">Sign & Complete Registration</button>
          <div id="contract-form-msg" class="form-message" aria-live="polite"></div>
        </form>
      </div>
    `;return`
    <div class="card">
      <h2>Review & Sign</h2>
      <p style="font-size:var(--text-small);color:var(--color-text-secondary);margin-bottom:var(--space-md)">Review your information, then sign the contract to complete registration.</p>

      <div style="display:grid;gap:var(--space-md)">
        <div style="padding:var(--space-md);background:var(--color-bg);border-radius:var(--radius-sm)">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:var(--space-xs)">
            <strong>Student Info</strong>
            <button class="link-btn edit-step-btn" data-step="1">Edit</button>
          </div>
          <p style="font-size:var(--text-small)">${i(e.first_name||"—")} ${i(e.last_name||"—")}, Grade ${i(e.grade||"—")}</p>
          ${e.student_email?`<p style="font-size:var(--text-small)">Email: ${i(e.student_email)}</p>`:""}
        </div>

        <div style="padding:var(--space-md);background:var(--color-bg);border-radius:var(--radius-sm)">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:var(--space-xs)">
            <strong>Parent/Guardian</strong>
            <button class="link-btn edit-step-btn" data-step="2">Edit</button>
          </div>
          <p style="font-size:var(--text-small)">${i(e.parent_first_name||"—")} ${i(e.parent_last_name||"—")}</p>
          <p style="font-size:var(--text-small)">${i(e.parent_email||"—")} | ${i(e.parent_phone||"—")}</p>
          ${e.parent2_first_name||e.parent2_email?`
          <p style="font-size:var(--text-small);margin-top:var(--space-xs)"><strong>Parent 2:</strong> ${i(e.parent2_first_name||"")} ${i(e.parent2_last_name||"")}</p>
          <p style="font-size:var(--text-small)">${i(e.parent2_email||"—")} | ${i(e.parent2_phone||"—")}</p>
          `:""}
        </div>

        <div style="padding:var(--space-md);background:var(--color-bg);border-radius:var(--radius-sm)">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:var(--space-xs)">
            <strong>Audition Song</strong>
            <button class="link-btn edit-step-btn" data-step="3">Edit</button>
          </div>
          <p style="font-size:var(--text-small)">${e.sings_own_disney_song?`Own song: ${i(e.song_name||"—")}`:"No own song"}</p>
        </div>

        <div style="padding:var(--space-md);background:var(--color-bg);border-radius:var(--radius-sm)">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:var(--space-xs)">
            <strong>Photo</strong>
            <button class="link-btn edit-step-btn" data-step="4">Edit</button>
          </div>
          <p style="font-size:var(--text-small)">${e.photo_storage_path?"✓ Photo uploaded":"⏳ No photo yet"}</p>
        </div>

        ${N()?`
        <div style="padding:var(--space-md);background:var(--color-bg);border-radius:var(--radius-sm)">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:var(--space-xs)">
            <strong>Role Preferences</strong>
            <button class="link-btn edit-step-btn" data-step="5">Edit</button>
          </div>
          <p style="font-size:var(--text-small)">${$.length>0?q($).map(o=>{const m=E.find(p=>p.id===o.audition_role_id);return`${o.rank_order}. ${i((m==null?void 0:m.name)||"Unknown")}`}).join(", "):"— No preferences set (optional)"}</p>
        </div>
        `:""}
      </div>

      ${r}
    </div>
  `}async function I(e){if(!t)return;const n=L(t,S,(h==null?void 0:h.id)||null),r=t.registration_complete===!0;if(n.complete!==t.registration_complete&&(await P(t.id,{registration_complete:n.complete},e),t.registration_complete=n.complete),!r&&n.complete){const{error:o}=await se(t.id);o&&console.error("Registration schedule email failed:",o.message||o)}}function be(e,n){const r=document.getElementById("student-select");r&&r.addEventListener("change",()=>{u=1,n(r.value)});const o=document.getElementById("add-student-btn");o&&o.addEventListener("click",()=>{t=null,S=[],u=1,n(null,!0)});const m=document.getElementById("clear-registration-btn");m&&m.addEventListener("click",async()=>{if(!(t!=null&&t.id))return;const p=`${t.first_name||""} ${t.last_name||""}`.trim()||"this student";if(!window.confirm(`Clear registration for ${p}? This deletes the student record and all related registration data.`))return;m.disabled=!0;const{error:y}=await j(t.id);if(y){m.disabled=!1,window.alert("Failed to clear registration: "+y.message);return}t=w.filter(l=>l.id!==t.id)[0]||null,S=[],$=[],u=1,n((t==null?void 0:t.id)||null,!t)})}function ye(e){const n=document.getElementById("wizard-back-btn");n&&n.addEventListener("click",()=>{u>1&&(u--,e(t==null?void 0:t.id))}),document.querySelectorAll(".edit-step-btn").forEach(o=>{o.addEventListener("click",()=>{u=parseInt(o.dataset.step,10),e(t==null?void 0:t.id)})});const r=document.querySelector(".skip-step-btn");r&&r.addEventListener("click",()=>{u++,e(t==null?void 0:t.id)})}async function he(e){const n=document.getElementById("photo-preview");if(!n||!e)return;const{url:r}=await W(e);r&&(n.innerHTML=`<img src="${r}" alt="Student photo" class="photo-preview" />`)}function _e(e,n){const r=document.getElementById("student-form");r&&r.addEventListener("submit",async l=>{var f;l.preventDefault();const s=document.getElementById("student-form-msg"),a=r.querySelector("button"),c={firstName:document.getElementById("reg-first-name").value.trim(),lastName:document.getElementById("reg-last-name").value.trim(),grade:document.getElementById("reg-grade").value.trim()},d=((f=document.getElementById("reg-student-email"))==null?void 0:f.value.trim())||"";if(!c.firstName||!c.lastName||!c.grade){s.textContent="First name, last name, and grade are required.",s.className="form-message error";return}if(a.disabled=!0,a.textContent="Saving…",t){const{data:v,error:b}=await P(t.id,{first_name:c.firstName,last_name:c.lastName,grade:c.grade,student_email:d||null},e);if(b){s.textContent="Error: "+b.message,s.className="form-message error",a.disabled=!1,a.textContent="Save & Continue";return}t={...t,...v},await I(e),u=2,n(t.id)}else{const{data:v,error:b}=await H({familyAccountId:e,firstName:c.firstName,lastName:c.lastName,grade:c.grade,studentEmail:d||void 0,createdByUserId:e});if(b){s.textContent="Error: "+b.message,s.className="form-message error",a.disabled=!1,a.textContent="Save & Continue";return}t=v,await I(e),u=2,n(t.id)}});const o=document.getElementById("parent-form");if(o){o.addEventListener("submit",async s=>{var x,C,k,B,R;s.preventDefault();const a=document.getElementById("parent-form-msg"),c=o.querySelector("button"),d={parent_first_name:document.getElementById("reg-parent-first").value.trim(),parent_last_name:document.getElementById("reg-parent-last").value.trim(),parent_email:document.getElementById("reg-parent-email").value.trim(),parent_phone:document.getElementById("reg-parent-phone").value.trim()};if(((x=document.getElementById("reg-show-parent2"))==null?void 0:x.checked)?(d.parent2_first_name=((C=document.getElementById("reg-parent2-first"))==null?void 0:C.value.trim())||null,d.parent2_last_name=((k=document.getElementById("reg-parent2-last"))==null?void 0:k.value.trim())||null,d.parent2_email=((B=document.getElementById("reg-parent2-email"))==null?void 0:B.value.trim())||null,d.parent2_phone=((R=document.getElementById("reg-parent2-phone"))==null?void 0:R.value.trim())||null):(d.parent2_first_name=null,d.parent2_last_name=null,d.parent2_email=null,d.parent2_phone=null),!d.parent_first_name||!d.parent_last_name||!d.parent_email||!d.parent_phone){a.textContent="Parent 1 fields are required.",a.className="form-message error";return}if(Q(d.parent_email)){a.textContent="Student email addresses cannot be used. Please use a parent or guardian email.",a.className="form-message error";return}c.disabled=!0,c.textContent="Saving…";const{data:v,error:b}=await P(t.id,d,e);if(b){a.textContent="Error: "+b.message,a.className="form-message error",c.disabled=!1,c.textContent="Save & Continue";return}t={...t,...v},await I(e),u=3,n(t.id)});const l=document.getElementById("reg-show-parent2");l&&l.addEventListener("change",()=>{const s=document.getElementById("parent2-fields");s&&(s.style.display=l.checked?"block":"none")})}const m=document.getElementById("song-form");m&&(m.querySelectorAll('input[name="sings-own"]').forEach(l=>{l.addEventListener("change",()=>{const s=document.getElementById("song-name-field");s&&(s.style.display=l.value==="yes"&&l.checked?"block":"none")})}),m.addEventListener("submit",async l=>{var k,B;l.preventDefault();const s=document.getElementById("song-form-msg"),a=m.querySelector('button[type="submit"]'),c=((k=m.querySelector('input[name="sings-own"]:checked'))==null?void 0:k.value)==="yes",d=((B=document.getElementById("reg-song-name"))==null?void 0:B.value.trim())||"",{valid:f,error:v}=K(c,d);if(!f){s.textContent=v,s.className="form-message error";return}a.disabled=!0,a.textContent="Saving…";const b={sings_own_disney_song:c,song_name:c?d:null},{data:x,error:C}=await P(t.id,b,e);if(C){s.textContent="Error: "+C.message,s.className="form-message error",a.disabled=!1,a.textContent="Save & Continue";return}t={...t,...x},u=4,n(t.id)}));const p=document.getElementById("photo-form");p&&(p.addEventListener("submit",async l=>{l.preventDefault();const s=document.getElementById("photo-form-msg"),a=p.querySelector("button"),d=document.getElementById("reg-photo").files[0];if(!d){s.textContent="Please select a photo.",s.className="form-message error";return}a.disabled=!0,a.textContent="Uploading…",s.textContent="";try{const f=M(e,d.name),{error:v}=await O(f,d);if(v){s.textContent="Upload failed: "+(v.message||JSON.stringify(v)),s.className="form-message error",a.disabled=!1,a.textContent="Upload & Continue";return}const{data:b,error:x}=await P(t.id,{photo_storage_path:f},e);if(x){s.textContent="Error saving photo reference: "+(x.message||JSON.stringify(x)),s.className="form-message error",a.disabled=!1,a.textContent="Upload & Continue";return}t={...t,...b},await I(e),u++,n(t.id)}catch(f){s.textContent="Unexpected error: "+(f.message||String(f)),s.className="form-message error",a.disabled=!1,a.textContent="Upload & Continue"}}),t!=null&&t.photo_storage_path&&he(t.photo_storage_path));const g=document.getElementById("save-role-prefs-btn");g&&g.addEventListener("click",async()=>{const l=document.getElementById("role-prefs-msg"),s=document.querySelectorAll(".role-rank-select"),a=[];s.forEach(f=>{const v=parseInt(f.value,10);v&&a.push({roleId:f.dataset.roleId,rank:v})});const c=ne(a,E);if(!c.valid){l&&(l.textContent=c.errors[0]||"Each rank can only be used once.",l.className="form-message error");return}g.disabled=!0,g.textContent="Saving…",l&&(l.textContent="");const{error:d}=await te(t.id,a,e);if(d){l&&(l.textContent="Error: "+d.message,l.className="form-message error"),g.disabled=!1,g.textContent="Save & Continue";return}u++,n(t.id)});const y=document.getElementById("skip-role-prefs-btn");y&&y.addEventListener("click",()=>{u++,n(t.id)});const _=document.getElementById("contract-form");_&&_.addEventListener("submit",async l=>{l.preventDefault();const s=document.getElementById("contract-form-msg"),a=_.querySelector("button"),c=document.getElementById("reg-student-sig").value.trim(),d=document.getElementById("reg-parent-sig").value.trim(),{valid:f,errors:v}=Y(c,d);if(!f){s.textContent=v.join(" "),s.className="form-message error";return}a.disabled=!0,a.textContent="Signing…";const{error:b}=await G({studentId:t.id,contractId:h.id,studentTypedSignature:c,parentTypedSignature:d,signedByUserId:e});if(b){s.textContent="Error: "+b.message,s.className="form-message error",a.disabled=!1,a.textContent="Sign & Complete Registration";return}const{data:x}=await z(t.id);S=x||[],await I(e),n(t.id)})}function Le(){const e=document.createElement("div");e.className="page",e.innerHTML=`
    <p><a href="#/family">← Back to Dashboard</a></p>
    <h1>Student Registration 📋</h1>
    <div id="reg-student-selector"></div>
    <div id="reg-checklist"></div>
    <div id="reg-content"><p>Loading…</p></div>
  `;const{user:n}=U();if(!n)return e;const r=re();async function o(m,p=!1){await oe(n.id,m,p);const g=document.getElementById("reg-student-selector"),y=document.getElementById("reg-checklist"),_=document.getElementById("reg-content");if(!_)return;g&&(g.innerHTML=le()),y&&(y.innerHTML=t?de():"");const l=T(),s=l[u-1]||l[l.length-1];let a="";s==="Student Info"?a=me():s==="Parent/Guardian"?a=pe():s==="Audition Song"?a=ue():s==="Photo"?a=ge():s==="Role Preferences"?a=fe():s==="Review & Sign"&&(a=ve());const c=u>1?'<button id="wizard-back-btn" class="btn-ghost" style="margin-bottom:var(--space-md)">← Back</button>':"";_.innerHTML=`
      ${ie()}
      ${c}
      ${a}
    `,be(n.id,o),ye(o),_e(n.id,o)}return setTimeout(()=>o(r),0),e}export{Le as renderFamilyRegistration};
