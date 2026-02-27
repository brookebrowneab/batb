import{g as U}from"./index-DB_Xnewy.js";import{f as D,d as j,u as P,c as H}from"./students-VK94Ci_a.js";import{f as F,a as z,d as G}from"./contracts-DJnL5pUD.js";import{g as M,u as O,a as W}from"./storage-BA9vMCfO.js";import{v as Y,h as J,r as V}from"./sanitizeHtml-D1SfNnaG.js";import{v as K,e as L}from"./registration-BJf__55_.js";import{i as Q}from"./emailValidation-DoK9MuSU.js";import{e as l}from"./escapeHtml-lW1fV86Q.js";import{f as X,b as Z,c as ee,s as te}from"./rolePreferences-ETjakyug.js";import{v as ne,i as ae,s as q}from"./rolePreferences-B9XCX_X4.js";import{s as se}from"./notifications-Dqi7YQoX.js";import"./purify.es-B9ZVCkUG.js";import"./scheduling-DSZ8OVmG.js";let w=[],t=null,E=[],h=null,u=1,A=null,S=[],$=[];function re(){const e=window.location.hash||"",n=e.indexOf("?");return n===-1?null:new URLSearchParams(e.slice(n+1)).get("studentId")||null}function N(){return S.length>0&&ae(A)}function T(){const e=["Student Info","Parent/Guardian","Audition Song","Photo"];return N()&&e.push("Role Preferences"),e.push("Review & Sign"),e}async function oe(e,n=null,a=!1){const[o,i,d,g]=await Promise.all([D(e),F(),X(),Z()]);if(w=o.data||[],h=i.data,A=d.data,S=g.data||[],a?t=null:n?t=w.find(y=>y.id===n)||null:w.length>0?t=w[0]:t=null,t){const[y,_]=await Promise.all([z(t.id),N()?ee(t.id):{data:[]}]);E=y.data||[],$=_.data||[]}else E=[],$=[]}function ie(){const e=T();let n='<div class="wizard-progress">';for(let a=1;a<=e.length;a++){a>1&&(n+=`<div class="wizard-progress__connector${a<=u?" wizard-progress__connector--complete":""}"></div>`);let o="wizard-progress__dot",i=String(a);a<u?(o+=" wizard-progress__dot--complete",i="✓"):a===u&&(o+=" wizard-progress__dot--active"),n+=`<div class="wizard-progress__step"><div class="${o}">${i}</div><span class="${a===u?"wizard-progress__label wizard-progress__label--active":"wizard-progress__label"}">${e[a-1]}</span></div>`}return n+="</div>",n}function le(){let e="";if(w.length>1){const n=w.map(a=>{const o=t&&a.id===t.id?"selected":"";return`<option value="${a.id}" ${o}>${l(a.first_name||"Unnamed")} ${l(a.last_name||"Student")}</option>`}).join("");e+=`<div class="student-selector"><label for="student-select"><strong>Student:</strong></label><select id="student-select">${n}</select></div>`}return w.length>=1&&(e+=`
      <div style="display:flex;gap:var(--space-sm);flex-wrap:wrap;margin-bottom:var(--space-md)">
        <button id="add-student-btn" class="btn-small">+ Add Another Student</button>
        ${t?'<button id="clear-registration-btn" class="btn-small btn-secondary">Clear This Registration</button>':""}
      </div>
    `),e}function de(){const e=L(t,E,(h==null?void 0:h.id)||null);return e.complete?'<div class="enchanted-banner" style="margin-bottom:var(--space-md)"><div class="enchanted-banner__icon">🌹</div><div class="enchanted-banner__content"><div class="enchanted-banner__title">Registration Complete!</div><div class="enchanted-banner__message">All requirements are met. Dance and vocal schedules are assigned by staff.</div><a class="enchanted-banner__link" href="#/family/schedule">View schedule →</a></div></div>':`<div class="warning-box student-card" style="margin-bottom:var(--space-md)"><strong>Registration Incomplete</strong><p style="margin-top:var(--space-xs)">Still needed:</p><ul style="margin:0.25rem 0 0 1.25rem;padding:0">${e.missing.map(n=>`<li>${n}</li>`).join("")}</ul></div>`}function ce(){return t&&(t.parent_first_name||t.parent_email)?t:w.find(n=>n.parent_first_name||n.parent_email)||t||{}}function me(){const e=t||{};return`
    <div class="card">
      <h2>Student Information</h2>
      <p style="font-size:var(--text-small);color:var(--color-text-secondary);margin-bottom:var(--space-md)">Enter the student's basic details.</p>
      <form id="student-form" class="login-form" style="max-width:100%">
        <label for="reg-first-name">First Name *</label>
        <input type="text" id="reg-first-name" required value="${l(e.first_name||"")}" />
        <label for="reg-last-name">Last Name *</label>
        <input type="text" id="reg-last-name" required value="${l(e.last_name||"")}" />
        <label for="reg-grade">Grade *</label>
        <input type="text" id="reg-grade" required value="${l(e.grade||"")}" placeholder="e.g. 5, 6, 7" />
        <label for="reg-student-email">Student Email (optional)</label>
        <input type="email" id="reg-student-email" value="${l(e.student_email||"")}" placeholder="student@example.com" />
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
        <input type="text" id="reg-parent-first" required value="${l(e.parent_first_name||"")}" />
        <label for="reg-parent-last">Last Name *</label>
        <input type="text" id="reg-parent-last" required value="${l(e.parent_last_name||"")}" />
        <label for="reg-parent-email">Email *</label>
        <input type="email" id="reg-parent-email" required value="${l(e.parent_email||"")}" />
        <label for="reg-parent-phone">Phone *</label>
        <input type="tel" id="reg-parent-phone" required value="${l(e.parent_phone||"")}" placeholder="(555) 123-4567" />

        <div style="margin-top:var(--space-md);padding-top:var(--space-md);border-top:1px solid var(--color-border-light)">
          <label style="display:flex;align-items:center;gap:var(--space-sm);cursor:pointer">
            <input type="checkbox" id="reg-show-parent2" ${e.parent2_first_name||e.parent2_email?"checked":""} />
            Add second parent/guardian (optional)
          </label>
        </div>
        <div id="parent2-fields" style="display:${e.parent2_first_name||e.parent2_email?"block":"none"};margin-top:var(--space-sm)">
          <label for="reg-parent2-first">First Name</label>
          <input type="text" id="reg-parent2-first" value="${l(e.parent2_first_name||"")}" />
          <label for="reg-parent2-last">Last Name</label>
          <input type="text" id="reg-parent2-last" value="${l(e.parent2_last_name||"")}" />
          <label for="reg-parent2-email">Email</label>
          <input type="email" id="reg-parent2-email" value="${l(e.parent2_email||"")}" />
          <label for="reg-parent2-phone">Phone</label>
          <input type="tel" id="reg-parent2-phone" value="${l(e.parent2_phone||"")}" placeholder="(555) 123-4567" />
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
          <input type="text" id="reg-song-name" value="${l(e.song_name||"")}" placeholder="e.g. Part of Your World" />
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
  `}function fe(){if(!t)return'<div class="card"><h2>Role Preferences</h2><p class="placeholder-notice">Complete student info first.</p></div>';const e=q($),n=new Map(e.map(d=>[d.audition_role_id,d.rank_order])),a=S.map((d,g)=>g+1);let o=S.map(d=>{const g=n.get(d.id)||"",y=a.map(_=>`<option value="${_}" ${g===_?"selected":""}>${_}</option>`).join("");return`
      <div class="role-pref-row" style="display:flex;align-items:center;gap:var(--space-sm);padding:var(--space-sm) 0;border-bottom:1px solid var(--color-border)">
        <div style="flex:1"><strong>${l(d.name)}</strong></div>
        <select class="role-rank-select" data-role-id="${d.id}" style="width:80px">
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
  `}function ve(){if(!t)return'<div class="card"><h2>Review & Sign</h2><p class="placeholder-notice">Complete previous steps first.</p></div>';const e=t,n=h&&J(E,h.id);let a="";if(!h)a='<p class="placeholder-notice" style="margin-top:var(--space-md)">No contract available.</p>';else if(n){const o=E.find(i=>i.contract_id===h.id);a=`
      <div class="success-box" style="padding:var(--space-md);border-radius:var(--radius-sm);margin-top:var(--space-lg)">
        <strong>✓ Contract signed!</strong>
        <p style="font-size:var(--text-small)">Student: ${l(o.student_typed_signature)}</p>
        <p style="font-size:var(--text-small)">Parent: ${l(o.parent_typed_signature)}</p>
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
          <p style="font-size:var(--text-small)">${l(e.first_name||"—")} ${l(e.last_name||"—")}, Grade ${l(e.grade||"—")}</p>
          ${e.student_email?`<p style="font-size:var(--text-small)">Email: ${l(e.student_email)}</p>`:""}
        </div>

        <div style="padding:var(--space-md);background:var(--color-bg);border-radius:var(--radius-sm)">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:var(--space-xs)">
            <strong>Parent/Guardian</strong>
            <button class="link-btn edit-step-btn" data-step="2">Edit</button>
          </div>
          <p style="font-size:var(--text-small)">${l(e.parent_first_name||"—")} ${l(e.parent_last_name||"—")}</p>
          <p style="font-size:var(--text-small)">${l(e.parent_email||"—")} | ${l(e.parent_phone||"—")}</p>
          ${e.parent2_first_name||e.parent2_email?`
          <p style="font-size:var(--text-small);margin-top:var(--space-xs)"><strong>Parent 2:</strong> ${l(e.parent2_first_name||"")} ${l(e.parent2_last_name||"")}</p>
          <p style="font-size:var(--text-small)">${l(e.parent2_email||"—")} | ${l(e.parent2_phone||"—")}</p>
          `:""}
        </div>

        <div style="padding:var(--space-md);background:var(--color-bg);border-radius:var(--radius-sm)">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:var(--space-xs)">
            <strong>Audition Song</strong>
            <button class="link-btn edit-step-btn" data-step="3">Edit</button>
          </div>
          <p style="font-size:var(--text-small)">${e.sings_own_disney_song?`Own song: ${l(e.song_name||"—")}`:"No own song"}</p>
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
          <p style="font-size:var(--text-small)">${$.length>0?q($).map(o=>{const i=S.find(d=>d.id===o.audition_role_id);return`${o.rank_order}. ${l((i==null?void 0:i.name)||"Unknown")}`}).join(", "):"— No preferences set (optional)"}</p>
        </div>
        `:""}
      </div>

      ${a}
    </div>
  `}async function I(e){if(!t)return;const n=L(t,E,(h==null?void 0:h.id)||null),a=t.registration_complete===!0;if(n.complete!==t.registration_complete&&(await P(t.id,{registration_complete:n.complete},e),t.registration_complete=n.complete),!a&&n.complete){const{error:o}=await se(t.id);o&&console.error("Registration schedule email failed:",o.message||o)}}function be(e,n){const a=document.getElementById("student-select");a&&a.addEventListener("change",()=>{u=1,n(a.value)});const o=document.getElementById("add-student-btn");o&&o.addEventListener("click",()=>{t=null,E=[],u=1,n(null,!0)});const i=document.getElementById("clear-registration-btn");i&&i.addEventListener("click",async()=>{if(!(t!=null&&t.id))return;const d=`${t.first_name||""} ${t.last_name||""}`.trim()||"this student";if(!window.confirm(`Clear registration for ${d}? This deletes the student record and all related registration data.`))return;i.disabled=!0;const{error:y}=await j(t.id);if(y){i.disabled=!1,window.alert("Failed to clear registration: "+y.message);return}t=w.filter(c=>c.id!==t.id)[0]||null,E=[],$=[],u=1,n((t==null?void 0:t.id)||null,!t)})}function ye(e){const n=document.getElementById("wizard-back-btn");n&&n.addEventListener("click",()=>{u>1&&(u--,e(t==null?void 0:t.id))}),document.querySelectorAll(".edit-step-btn").forEach(o=>{o.addEventListener("click",()=>{u=parseInt(o.dataset.step,10),e(t==null?void 0:t.id)})});const a=document.querySelector(".skip-step-btn");a&&a.addEventListener("click",()=>{u++,e(t==null?void 0:t.id)})}async function he(e){const n=document.getElementById("photo-preview");if(!n||!e)return;const{url:a}=await W(e);a&&(n.innerHTML=`<img src="${a}" alt="Student photo" class="photo-preview" />`)}function _e(){const e=Array.from(document.querySelectorAll(".role-rank-select"));if(e.length===0)return;function n(){const a=new Set;e.forEach(i=>{const d=i.value;if(d){if(a.has(d)){i.value="";return}a.add(d)}});const o=new Set(e.map(i=>i.value).filter(Boolean));e.forEach(i=>{Array.from(i.options).forEach(d=>{if(!d.value){d.disabled=!1;return}d.disabled=d.value!==i.value&&o.has(d.value)})})}e.forEach(a=>{a.addEventListener("change",()=>{const o=document.getElementById("role-prefs-msg");o&&(o.textContent=""),n()})}),n()}function xe(e,n){const a=document.getElementById("student-form");a&&a.addEventListener("submit",async c=>{var f;c.preventDefault();const r=document.getElementById("student-form-msg"),s=a.querySelector("button"),p={firstName:document.getElementById("reg-first-name").value.trim(),lastName:document.getElementById("reg-last-name").value.trim(),grade:document.getElementById("reg-grade").value.trim()},m=((f=document.getElementById("reg-student-email"))==null?void 0:f.value.trim())||"";if(!p.firstName||!p.lastName||!p.grade){r.textContent="First name, last name, and grade are required.",r.className="form-message error";return}if(s.disabled=!0,s.textContent="Saving…",t){const{data:v,error:b}=await P(t.id,{first_name:p.firstName,last_name:p.lastName,grade:p.grade,student_email:m||null},e);if(b){r.textContent="Error: "+b.message,r.className="form-message error",s.disabled=!1,s.textContent="Save & Continue";return}t={...t,...v},await I(e),u=2,n(t.id)}else{const{data:v,error:b}=await H({familyAccountId:e,firstName:p.firstName,lastName:p.lastName,grade:p.grade,studentEmail:m||void 0,createdByUserId:e});if(b){r.textContent="Error: "+b.message,r.className="form-message error",s.disabled=!1,s.textContent="Save & Continue";return}t=v,await I(e),u=2,n(t.id)}});const o=document.getElementById("parent-form");if(o){o.addEventListener("submit",async r=>{var x,C,k,B,R;r.preventDefault();const s=document.getElementById("parent-form-msg"),p=o.querySelector("button"),m={parent_first_name:document.getElementById("reg-parent-first").value.trim(),parent_last_name:document.getElementById("reg-parent-last").value.trim(),parent_email:document.getElementById("reg-parent-email").value.trim(),parent_phone:document.getElementById("reg-parent-phone").value.trim()};if(((x=document.getElementById("reg-show-parent2"))==null?void 0:x.checked)?(m.parent2_first_name=((C=document.getElementById("reg-parent2-first"))==null?void 0:C.value.trim())||null,m.parent2_last_name=((k=document.getElementById("reg-parent2-last"))==null?void 0:k.value.trim())||null,m.parent2_email=((B=document.getElementById("reg-parent2-email"))==null?void 0:B.value.trim())||null,m.parent2_phone=((R=document.getElementById("reg-parent2-phone"))==null?void 0:R.value.trim())||null):(m.parent2_first_name=null,m.parent2_last_name=null,m.parent2_email=null,m.parent2_phone=null),!m.parent_first_name||!m.parent_last_name||!m.parent_email||!m.parent_phone){s.textContent="Parent 1 fields are required.",s.className="form-message error";return}if(Q(m.parent_email)){s.textContent="Student email addresses cannot be used. Please use a parent or guardian email.",s.className="form-message error";return}p.disabled=!0,p.textContent="Saving…";const{data:v,error:b}=await P(t.id,m,e);if(b){s.textContent="Error: "+b.message,s.className="form-message error",p.disabled=!1,p.textContent="Save & Continue";return}t={...t,...v},await I(e),u=3,n(t.id)});const c=document.getElementById("reg-show-parent2");c&&c.addEventListener("change",()=>{const r=document.getElementById("parent2-fields");r&&(r.style.display=c.checked?"block":"none")})}const i=document.getElementById("song-form");i&&(i.querySelectorAll('input[name="sings-own"]').forEach(c=>{c.addEventListener("change",()=>{const r=document.getElementById("song-name-field");r&&(r.style.display=c.value==="yes"&&c.checked?"block":"none")})}),i.addEventListener("submit",async c=>{var k,B;c.preventDefault();const r=document.getElementById("song-form-msg"),s=i.querySelector('button[type="submit"]'),p=((k=i.querySelector('input[name="sings-own"]:checked'))==null?void 0:k.value)==="yes",m=((B=document.getElementById("reg-song-name"))==null?void 0:B.value.trim())||"",{valid:f,error:v}=K(p,m);if(!f){r.textContent=v,r.className="form-message error";return}s.disabled=!0,s.textContent="Saving…";const b={sings_own_disney_song:p,song_name:p?m:null},{data:x,error:C}=await P(t.id,b,e);if(C){r.textContent="Error: "+C.message,r.className="form-message error",s.disabled=!1,s.textContent="Save & Continue";return}t={...t,...x},u=4,n(t.id)}));const d=document.getElementById("photo-form");d&&(d.addEventListener("submit",async c=>{c.preventDefault();const r=document.getElementById("photo-form-msg"),s=d.querySelector("button"),m=document.getElementById("reg-photo").files[0];if(!m){r.textContent="Please select a photo.",r.className="form-message error";return}s.disabled=!0,s.textContent="Uploading…",r.textContent="";try{const f=M(e,m.name),{error:v}=await O(f,m);if(v){r.textContent="Upload failed: "+(v.message||JSON.stringify(v)),r.className="form-message error",s.disabled=!1,s.textContent="Upload & Continue";return}const{data:b,error:x}=await P(t.id,{photo_storage_path:f},e);if(x){r.textContent="Error saving photo reference: "+(x.message||JSON.stringify(x)),r.className="form-message error",s.disabled=!1,s.textContent="Upload & Continue";return}t={...t,...b},await I(e),u++,n(t.id)}catch(f){r.textContent="Unexpected error: "+(f.message||String(f)),r.className="form-message error",s.disabled=!1,s.textContent="Upload & Continue"}}),t!=null&&t.photo_storage_path&&he(t.photo_storage_path)),_e();const g=document.getElementById("save-role-prefs-btn");g&&g.addEventListener("click",async()=>{const c=document.getElementById("role-prefs-msg"),r=document.querySelectorAll(".role-rank-select"),s=[];r.forEach(f=>{const v=parseInt(f.value,10);v&&s.push({roleId:f.dataset.roleId,rank:v})});const p=ne(s,S);if(!p.valid){c&&(c.textContent=p.errors[0]||"Each rank can only be used once.",c.className="form-message error");return}g.disabled=!0,g.textContent="Saving…",c&&(c.textContent="");const{error:m}=await te(t.id,s,e);if(m){c&&(c.textContent="Error: "+m.message,c.className="form-message error"),g.disabled=!1,g.textContent="Save & Continue";return}u++,n(t.id)});const y=document.getElementById("skip-role-prefs-btn");y&&y.addEventListener("click",()=>{u++,n(t.id)});const _=document.getElementById("contract-form");_&&_.addEventListener("submit",async c=>{c.preventDefault();const r=document.getElementById("contract-form-msg"),s=_.querySelector("button"),p=document.getElementById("reg-student-sig").value.trim(),m=document.getElementById("reg-parent-sig").value.trim(),{valid:f,errors:v}=Y(p,m);if(!f){r.textContent=v.join(" "),r.className="form-message error";return}s.disabled=!0,s.textContent="Signing…";const{error:b}=await G({studentId:t.id,contractId:h.id,studentTypedSignature:p,parentTypedSignature:m,signedByUserId:e});if(b){r.textContent="Error: "+b.message,r.className="form-message error",s.disabled=!1,s.textContent="Sign & Complete Registration";return}const{data:x}=await z(t.id);E=x||[],await I(e),n(t.id)})}function qe(){const e=document.createElement("div");e.className="page",e.innerHTML=`
    <p><a href="#/family">← Back to Dashboard</a></p>
    <h1>Student Registration 📋</h1>
    <div id="reg-student-selector"></div>
    <div id="reg-checklist"></div>
    <div id="reg-content"><p>Loading…</p></div>
  `;const{user:n}=U();if(!n)return e;const a=re();async function o(i,d=!1){await oe(n.id,i,d);const g=document.getElementById("reg-student-selector"),y=document.getElementById("reg-checklist"),_=document.getElementById("reg-content");if(!_)return;g&&(g.innerHTML=le()),y&&(y.innerHTML=t?de():"");const c=T(),r=c[u-1]||c[c.length-1];let s="";r==="Student Info"?s=me():r==="Parent/Guardian"?s=pe():r==="Audition Song"?s=ue():r==="Photo"?s=ge():r==="Role Preferences"?s=fe():r==="Review & Sign"&&(s=ve());const p=u>1?'<button id="wizard-back-btn" class="btn-ghost" style="margin-bottom:var(--space-md)">← Back</button>':"";_.innerHTML=`
      ${ie()}
      ${p}
      ${s}
    `,be(n.id,o),ye(o),xe(n.id,o)}return setTimeout(()=>o(a),0),e}export{qe as renderFamilyRegistration};
