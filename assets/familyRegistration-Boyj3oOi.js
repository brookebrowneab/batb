import{g as U}from"./index-CCDzG8We.js";import{f as D,d as j,u as P,c as H}from"./students-DdAyGSLZ.js";import{f as F,a as z,d as G}from"./contracts-DrCmp38u.js";import{g as M,u as O,a as W}from"./storage-DRq_eBM_.js";import{v as Y,h as J,r as V}from"./sanitizeHtml-D1SfNnaG.js";import{v as K,e as L}from"./registration-BJf__55_.js";import{i as Q}from"./emailValidation-DoK9MuSU.js";import{e as d}from"./escapeHtml-lW1fV86Q.js";import{f as X,b as Z,c as ee,s as te}from"./rolePreferences-enmwvfCd.js";import{v as ne,i as ae,s as q}from"./rolePreferences-B9XCX_X4.js";import{s as se}from"./notifications-0jJcO3tZ.js";import"./purify.es-B9ZVCkUG.js";import"./scheduling-DSZ8OVmG.js";let E=[],t=null,S=[],h=null,u=1,A=null,$=[],C=[];function re(){const e=window.location.hash||"",n=e.indexOf("?");return n===-1?null:new URLSearchParams(e.slice(n+1)).get("studentId")||null}function N(){return $.length>0&&ae(A)}function T(){const e=["Student Info","Parent/Guardian","Audition Song","Photo"];return N()&&e.push("Role Preferences"),e.push("Review & Sign"),e}async function oe(e,n=null,a=!1){const[o,i,l,f]=await Promise.all([D(e),F(),X(),Z()]);if(E=o.data||[],h=i.data,A=l.data,$=f.data||[],a?t=null:n?t=E.find(g=>g.id===n)||null:E.length>0?t=E[0]:t=null,t){const[g,_]=await Promise.all([z(t.id),N()?ee(t.id):{data:[]}]);S=g.data||[],C=_.data||[]}else S=[],C=[]}function ie(){const e=T();let n='<div class="wizard-progress">';for(let a=1;a<=e.length;a++){a>1&&(n+=`<div class="wizard-progress__connector${a<=u?" wizard-progress__connector--complete":""}"></div>`);let o="wizard-progress__dot",i=String(a);a<u?(o+=" wizard-progress__dot--complete",i="✓"):a===u&&(o+=" wizard-progress__dot--active"),n+=`<div class="wizard-progress__step"><div class="${o}">${i}</div><span class="${a===u?"wizard-progress__label wizard-progress__label--active":"wizard-progress__label"}">${e[a-1]}</span></div>`}return n+="</div>",n}function le(){let e="";if(E.length>1){const n=E.map(a=>{const o=t&&a.id===t.id?"selected":"";return`<option value="${a.id}" ${o}>${d(a.first_name||"Unnamed")} ${d(a.last_name||"Student")}</option>`}).join("");e+=`<div class="student-selector"><label for="student-select"><strong>Student:</strong></label><select id="student-select">${n}</select></div>`}return E.length>=1&&(e+=`
      <div style="display:flex;gap:var(--space-sm);flex-wrap:wrap;margin-bottom:var(--space-md)">
        <button id="add-student-btn" class="btn-small">+ Add Another Student</button>
        ${t?'<button id="clear-registration-btn" class="btn-small btn-secondary">Clear This Registration</button>':""}
      </div>
    `),e}function de(){const e=L(t,S,(h==null?void 0:h.id)||null);return e.complete?'<div class="enchanted-banner" style="margin-bottom:var(--space-md)"><div class="enchanted-banner__icon">🌹</div><div class="enchanted-banner__content"><div class="enchanted-banner__title">Registration Complete!</div><div class="enchanted-banner__message">All requirements are met. Dance and vocal schedules are assigned by staff.</div><a class="enchanted-banner__link" href="#/family/schedule">View schedule →</a></div></div>':`<div class="warning-box student-card" style="margin-bottom:var(--space-md)"><strong>Registration Incomplete</strong><p style="margin-top:var(--space-xs)">Still needed:</p><ul style="margin:0.25rem 0 0 1.25rem;padding:0">${e.missing.map(n=>`<li>${n}</li>`).join("")}</ul></div>`}function ce(){return t&&(t.parent_first_name||t.parent_email)?t:E.find(n=>n.parent_first_name||n.parent_email)||t||{}}function me(){const e=t||{};return`
    <div class="card">
      <h2>Student Information</h2>
      <p style="font-size:var(--text-small);color:var(--color-text-secondary);margin-bottom:var(--space-md)">Enter the student's basic details.</p>
      <form id="student-form" class="login-form" style="max-width:100%">
        <label for="reg-first-name">First Name *</label>
        <input type="text" id="reg-first-name" required value="${d(e.first_name||"")}" />
        <label for="reg-last-name">Last Name *</label>
        <input type="text" id="reg-last-name" required value="${d(e.last_name||"")}" />
        <label for="reg-grade">Grade *</label>
        <input type="text" id="reg-grade" required value="${d(e.grade||"")}" placeholder="e.g. 5, 6, 7" />
        <label for="reg-student-email">Student Email (optional)</label>
        <input type="email" id="reg-student-email" value="${d(e.student_email||"")}" placeholder="student@example.com" />
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
        <input type="text" id="reg-parent-first" required value="${d(e.parent_first_name||"")}" />
        <label for="reg-parent-last">Last Name *</label>
        <input type="text" id="reg-parent-last" required value="${d(e.parent_last_name||"")}" />
        <label for="reg-parent-email">Email *</label>
        <input type="email" id="reg-parent-email" required value="${d(e.parent_email||"")}" />
        <label for="reg-parent-phone">Phone *</label>
        <input type="tel" id="reg-parent-phone" required value="${d(e.parent_phone||"")}" placeholder="(555) 123-4567" />

        <div style="margin-top:var(--space-md);padding-top:var(--space-md);border-top:1px solid var(--color-border-light)">
          <label style="display:flex;align-items:center;gap:var(--space-sm);cursor:pointer">
            <input type="checkbox" id="reg-show-parent2" ${e.parent2_first_name||e.parent2_email?"checked":""} />
            Add second parent/guardian (optional)
          </label>
        </div>
        <div id="parent2-fields" style="display:${e.parent2_first_name||e.parent2_email?"block":"none"};margin-top:var(--space-sm)">
          <label for="reg-parent2-first">First Name</label>
          <input type="text" id="reg-parent2-first" value="${d(e.parent2_first_name||"")}" />
          <label for="reg-parent2-last">Last Name</label>
          <input type="text" id="reg-parent2-last" value="${d(e.parent2_last_name||"")}" />
          <label for="reg-parent2-email">Email</label>
          <input type="email" id="reg-parent2-email" value="${d(e.parent2_email||"")}" />
          <label for="reg-parent2-phone">Phone</label>
          <input type="tel" id="reg-parent2-phone" value="${d(e.parent2_phone||"")}" placeholder="(555) 123-4567" />
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
          <input type="text" id="reg-song-name" value="${d(e.song_name||"")}" placeholder="e.g. Part of Your World" />
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
  `}function fe(){if(!t)return'<div class="card"><h2>Role Preferences</h2><p class="placeholder-notice">Complete student info first.</p></div>';const e=q(C),n=new Map(e.map(l=>[l.audition_role_id,l.rank_order])),a=$.map((l,f)=>f+1);let o=$.map(l=>{const f=n.get(l.id)||"",g=a.map(_=>`<option value="${_}" ${f===_?"selected":""}>${_}</option>`).join("");return`
      <div class="role-pref-row" style="display:flex;align-items:center;gap:var(--space-sm);padding:var(--space-sm) 0;border-bottom:1px solid var(--color-border)">
        <div style="flex:1"><strong>${d(l.name)}</strong></div>
        <select class="role-rank-select" data-role-id="${l.id}" style="width:80px">
          <option value="">—</option>
          ${g}
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
  `}function ve(){if(!t)return'<div class="card"><h2>Review & Sign</h2><p class="placeholder-notice">Complete previous steps first.</p></div>';const e=t,n=h&&J(S,h.id);let a="";if(!h)a='<p class="placeholder-notice" style="margin-top:var(--space-md)">No contract available.</p>';else if(n){const o=S.find(i=>i.contract_id===h.id);a=`
      <div class="success-box" style="padding:var(--space-md);border-radius:var(--radius-sm);margin-top:var(--space-lg)">
        <strong>✓ Contract signed!</strong>
        <p style="font-size:var(--text-small)">Student: ${d(o.student_typed_signature)}</p>
        <p style="font-size:var(--text-small)">Parent: ${d(o.parent_typed_signature)}</p>
        <p style="font-size:var(--text-small);color:var(--color-text-muted)">Signed: ${new Date(o.created_at).toLocaleString()}</p>
      </div>
    `}else a=`
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
          <p style="font-size:var(--text-small)">${d(e.first_name||"—")} ${d(e.last_name||"—")}, Grade ${d(e.grade||"—")}</p>
          ${e.student_email?`<p style="font-size:var(--text-small)">Email: ${d(e.student_email)}</p>`:""}
        </div>

        <div style="padding:var(--space-md);background:var(--color-bg);border-radius:var(--radius-sm)">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:var(--space-xs)">
            <strong>Parent/Guardian</strong>
            <button class="link-btn edit-step-btn" data-step="2">Edit</button>
          </div>
          <p style="font-size:var(--text-small)">${d(e.parent_first_name||"—")} ${d(e.parent_last_name||"—")}</p>
          <p style="font-size:var(--text-small)">${d(e.parent_email||"—")} | ${d(e.parent_phone||"—")}</p>
          ${e.parent2_first_name||e.parent2_email?`
          <p style="font-size:var(--text-small);margin-top:var(--space-xs)"><strong>Parent 2:</strong> ${d(e.parent2_first_name||"")} ${d(e.parent2_last_name||"")}</p>
          <p style="font-size:var(--text-small)">${d(e.parent2_email||"—")} | ${d(e.parent2_phone||"—")}</p>
          `:""}
        </div>

        <div style="padding:var(--space-md);background:var(--color-bg);border-radius:var(--radius-sm)">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:var(--space-xs)">
            <strong>Audition Song</strong>
            <button class="link-btn edit-step-btn" data-step="3">Edit</button>
          </div>
          <p style="font-size:var(--text-small)">${e.sings_own_disney_song?`Own song: ${d(e.song_name||"—")}`:"No own song"}</p>
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
          <p style="font-size:var(--text-small)">${C.length>0?q(C).map(o=>{const i=$.find(l=>l.id===o.audition_role_id);return`${o.rank_order}. ${d((i==null?void 0:i.name)||"Unknown")}`}).join(", "):"— No preferences set (optional)"}</p>
        </div>
        `:""}
      </div>

      ${a}
    </div>
  `}async function I(e,n={}){const{forceSendScheduleEmail:a=!1}=n;if(!t)return;const o=L(t,S,(h==null?void 0:h.id)||null),i=t.registration_complete===!0;o.complete!==t.registration_complete&&(await P(t.id,{registration_complete:o.complete},e),t.registration_complete=o.complete);let l=null;if(o.complete&&(a||!i)){const{error:g}=await se(t.id);g&&(console.error("Registration schedule email failed:",g.message||g),l=g)}return{complete:o.complete,emailError:l}}function be(e,n){const a=document.getElementById("student-select");a&&a.addEventListener("change",()=>{u=1,n(a.value)});const o=document.getElementById("add-student-btn");o&&o.addEventListener("click",()=>{t=null,S=[],u=1,n(null,!0)});const i=document.getElementById("clear-registration-btn");i&&i.addEventListener("click",async()=>{if(!(t!=null&&t.id))return;const l=`${t.first_name||""} ${t.last_name||""}`.trim()||"this student";if(!window.confirm(`Clear registration for ${l}? This deletes the student record and all related registration data.`))return;i.disabled=!0;const{error:g}=await j(t.id);if(g){i.disabled=!1,window.alert("Failed to clear registration: "+g.message);return}t=E.filter(c=>c.id!==t.id)[0]||null,S=[],C=[],u=1,n((t==null?void 0:t.id)||null,!t)})}function ye(e){const n=document.getElementById("wizard-back-btn");n&&n.addEventListener("click",()=>{u>1&&(u--,e(t==null?void 0:t.id))}),document.querySelectorAll(".edit-step-btn").forEach(o=>{o.addEventListener("click",()=>{u=parseInt(o.dataset.step,10),e(t==null?void 0:t.id)})});const a=document.querySelector(".skip-step-btn");a&&a.addEventListener("click",()=>{u++,e(t==null?void 0:t.id)})}async function he(e){const n=document.getElementById("photo-preview");if(!n||!e)return;const{url:a}=await W(e);a&&(n.innerHTML=`<img src="${a}" alt="Student photo" class="photo-preview" />`)}function _e(){const e=Array.from(document.querySelectorAll(".role-rank-select"));if(e.length===0)return;function n(){const a=new Set;e.forEach(i=>{const l=i.value;if(l){if(a.has(l)){i.value="";return}a.add(l)}});const o=new Set(e.map(i=>i.value).filter(Boolean));e.forEach(i=>{Array.from(i.options).forEach(l=>{if(!l.value){l.disabled=!1;return}l.disabled=l.value!==i.value&&o.has(l.value)})})}e.forEach(a=>{a.addEventListener("change",()=>{const o=document.getElementById("role-prefs-msg");o&&(o.textContent=""),n()})}),n()}function xe(e,n){const a=document.getElementById("student-form");a&&a.addEventListener("submit",async c=>{var v;c.preventDefault();const s=document.getElementById("student-form-msg"),r=a.querySelector("button"),p={firstName:document.getElementById("reg-first-name").value.trim(),lastName:document.getElementById("reg-last-name").value.trim(),grade:document.getElementById("reg-grade").value.trim()},m=((v=document.getElementById("reg-student-email"))==null?void 0:v.value.trim())||"";if(!p.firstName||!p.lastName||!p.grade){s.textContent="First name, last name, and grade are required.",s.className="form-message error";return}if(r.disabled=!0,r.textContent="Saving…",t){const{data:b,error:y}=await P(t.id,{first_name:p.firstName,last_name:p.lastName,grade:p.grade,student_email:m||null},e);if(y){s.textContent="Error: "+y.message,s.className="form-message error",r.disabled=!1,r.textContent="Save & Continue";return}t={...t,...b},await I(e),u=2,n(t.id)}else{const{data:b,error:y}=await H({familyAccountId:e,firstName:p.firstName,lastName:p.lastName,grade:p.grade,studentEmail:m||void 0,createdByUserId:e});if(y){s.textContent="Error: "+y.message,s.className="form-message error",r.disabled=!1,r.textContent="Save & Continue";return}t=b,await I(e),u=2,n(t.id)}});const o=document.getElementById("parent-form");if(o){o.addEventListener("submit",async s=>{var x,w,k,B,R;s.preventDefault();const r=document.getElementById("parent-form-msg"),p=o.querySelector("button"),m={parent_first_name:document.getElementById("reg-parent-first").value.trim(),parent_last_name:document.getElementById("reg-parent-last").value.trim(),parent_email:document.getElementById("reg-parent-email").value.trim(),parent_phone:document.getElementById("reg-parent-phone").value.trim()};if(((x=document.getElementById("reg-show-parent2"))==null?void 0:x.checked)?(m.parent2_first_name=((w=document.getElementById("reg-parent2-first"))==null?void 0:w.value.trim())||null,m.parent2_last_name=((k=document.getElementById("reg-parent2-last"))==null?void 0:k.value.trim())||null,m.parent2_email=((B=document.getElementById("reg-parent2-email"))==null?void 0:B.value.trim())||null,m.parent2_phone=((R=document.getElementById("reg-parent2-phone"))==null?void 0:R.value.trim())||null):(m.parent2_first_name=null,m.parent2_last_name=null,m.parent2_email=null,m.parent2_phone=null),!m.parent_first_name||!m.parent_last_name||!m.parent_email||!m.parent_phone){r.textContent="Parent 1 fields are required.",r.className="form-message error";return}if(Q(m.parent_email)){r.textContent="Student email addresses cannot be used. Please use a parent or guardian email.",r.className="form-message error";return}p.disabled=!0,p.textContent="Saving…";const{data:b,error:y}=await P(t.id,m,e);if(y){r.textContent="Error: "+y.message,r.className="form-message error",p.disabled=!1,p.textContent="Save & Continue";return}t={...t,...b},await I(e),u=3,n(t.id)});const c=document.getElementById("reg-show-parent2");c&&c.addEventListener("change",()=>{const s=document.getElementById("parent2-fields");s&&(s.style.display=c.checked?"block":"none")})}const i=document.getElementById("song-form");i&&(i.querySelectorAll('input[name="sings-own"]').forEach(c=>{c.addEventListener("change",()=>{const s=document.getElementById("song-name-field");s&&(s.style.display=c.value==="yes"&&c.checked?"block":"none")})}),i.addEventListener("submit",async c=>{var k,B;c.preventDefault();const s=document.getElementById("song-form-msg"),r=i.querySelector('button[type="submit"]'),p=((k=i.querySelector('input[name="sings-own"]:checked'))==null?void 0:k.value)==="yes",m=((B=document.getElementById("reg-song-name"))==null?void 0:B.value.trim())||"",{valid:v,error:b}=K(p,m);if(!v){s.textContent=b,s.className="form-message error";return}r.disabled=!0,r.textContent="Saving…";const y={sings_own_disney_song:p,song_name:p?m:null},{data:x,error:w}=await P(t.id,y,e);if(w){s.textContent="Error: "+w.message,s.className="form-message error",r.disabled=!1,r.textContent="Save & Continue";return}t={...t,...x},u=4,n(t.id)}));const l=document.getElementById("photo-form");l&&(l.addEventListener("submit",async c=>{c.preventDefault();const s=document.getElementById("photo-form-msg"),r=l.querySelector("button"),m=document.getElementById("reg-photo").files[0];if(!m){s.textContent="Please select a photo.",s.className="form-message error";return}r.disabled=!0,r.textContent="Uploading…",s.textContent="";try{const v=M(e,m.name),{error:b}=await O(v,m);if(b){s.textContent="Upload failed: "+(b.message||JSON.stringify(b)),s.className="form-message error",r.disabled=!1,r.textContent="Upload & Continue";return}const{data:y,error:x}=await P(t.id,{photo_storage_path:v},e);if(x){s.textContent="Error saving photo reference: "+(x.message||JSON.stringify(x)),s.className="form-message error",r.disabled=!1,r.textContent="Upload & Continue";return}t={...t,...y},await I(e),u++,n(t.id)}catch(v){s.textContent="Unexpected error: "+(v.message||String(v)),s.className="form-message error",r.disabled=!1,r.textContent="Upload & Continue"}}),t!=null&&t.photo_storage_path&&he(t.photo_storage_path)),_e();const f=document.getElementById("save-role-prefs-btn");f&&f.addEventListener("click",async()=>{const c=document.getElementById("role-prefs-msg"),s=document.querySelectorAll(".role-rank-select"),r=[];s.forEach(v=>{const b=parseInt(v.value,10);b&&r.push({roleId:v.dataset.roleId,rank:b})});const p=ne(r,$);if(!p.valid){c&&(c.textContent=p.errors[0]||"Each rank can only be used once.",c.className="form-message error");return}f.disabled=!0,f.textContent="Saving…",c&&(c.textContent="");const{error:m}=await te(t.id,r,e);if(m){c&&(c.textContent="Error: "+m.message,c.className="form-message error"),f.disabled=!1,f.textContent="Save & Continue";return}u++,n(t.id)});const g=document.getElementById("skip-role-prefs-btn");g&&g.addEventListener("click",()=>{u++,n(t.id)});const _=document.getElementById("contract-form");_&&_.addEventListener("submit",async c=>{c.preventDefault();const s=document.getElementById("contract-form-msg"),r=_.querySelector("button"),p=document.getElementById("reg-student-sig").value.trim(),m=document.getElementById("reg-parent-sig").value.trim(),{valid:v,errors:b}=Y(p,m);if(!v){s.textContent=b.join(" "),s.className="form-message error";return}r.disabled=!0,r.textContent="Signing…";const{error:y}=await G({studentId:t.id,contractId:h.id,studentTypedSignature:p,parentTypedSignature:m,signedByUserId:e});if(y){s.textContent="Error: "+y.message,s.className="form-message error",r.disabled=!1,r.textContent="Sign & Complete Registration";return}const{data:x}=await z(t.id);S=x||[];const{emailError:w}=await I(e,{forceSendScheduleEmail:!0});w&&(s.textContent=`Registration completed, but schedule email failed to send. Please contact staff. (${w.message||"Email send error"})`,s.className="form-message error"),n(t.id)})}function qe(){const e=document.createElement("div");e.className="page",e.innerHTML=`
    <p><a href="#/family">← Back to Dashboard</a></p>
    <h1>Student Registration 📋</h1>
    <div id="reg-student-selector"></div>
    <div id="reg-checklist"></div>
    <div id="reg-content"><p>Loading…</p></div>
  `;const{user:n}=U();if(!n)return e;const a=re();async function o(i,l=!1){await oe(n.id,i,l);const f=document.getElementById("reg-student-selector"),g=document.getElementById("reg-checklist"),_=document.getElementById("reg-content");if(!_)return;f&&(f.innerHTML=le()),g&&(g.innerHTML=t?de():"");const c=T(),s=c[u-1]||c[c.length-1];let r="";s==="Student Info"?r=me():s==="Parent/Guardian"?r=pe():s==="Audition Song"?r=ue():s==="Photo"?r=ge():s==="Role Preferences"?r=fe():s==="Review & Sign"&&(r=ve());const p=u>1?'<button id="wizard-back-btn" class="btn-ghost" style="margin-bottom:var(--space-md)">← Back</button>':"";_.innerHTML=`
      ${ie()}
      ${p}
      ${r}
    `,be(n.id,o),ye(o),xe(n.id,o)}return setTimeout(()=>o(a),0),e}export{qe as renderFamilyRegistration};
