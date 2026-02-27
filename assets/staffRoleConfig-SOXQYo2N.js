import{g as f,a as B}from"./index-DAsUYhLQ.js";import{f as C,b as I,g as R,u as $,h as k,i as L,j as N,k as M}from"./rolePreferences-r3qAC502.js";import{l as y}from"./auditLog-D7Pcihaz.js";import{e as g}from"./escapeHtml-lW1fV86Q.js";let c=null,p=[],b=null;const S={show_title:"Beauty and the Beast",subject_template:"{{Title of the Show}} Audition Details - Please Review",body_template:`Hi {{Student Name}} and Family,

We're excited to get auditions underway for {{Title of the Show}} - thank you for signing up!

Please review the required audition materials for:
- Belle
- Lumiere
- Mrs. Potts
- Gaston
- Le Feu

All songs, tracks, and instructions are here:
https://practice-batb.adcatheatre.com/

Each student will be assigned:
- Dance Day: {{Dance Day Date}} ({{Dance Start Time}}-{{Dance End Time}})
- Vocal Day: {{Vocal Day Date}} ({{Vocal Start Time}}-{{Vocal End Time}})

Please also keep callback date(s) - {{Callback Date(s)}} ({{Callback Start Time}}-{{Callback End Time}}) - open in case your student is invited back.

Students should come prepared and comfortable with the posted materials. The more prepared they are, the more confident and focused they'll feel in the room.

We're looking forward to a strong, fun start to the season. Thank you for being part of it!

Warmly,
[Your Name]
[Production Team / Organization Name]`};async function j(){const[a,i,o]=await Promise.all([C(),I(),R()]);a.data&&(c=a.data),i.data&&(p=i.data),b=o.data||{...S}}function D(){const a=(c==null?void 0:c.vocal_mode)||"timeslot";return`
    <div class="card" style="margin-bottom:var(--space-lg)">
      <h2 style="margin-top:0">Vocal Audition Mode</h2>
      <p style="font-size:var(--text-small);color:var(--color-text-secondary);margin-bottom:var(--space-md)">
        Choose how families sign up for vocal auditions.
      </p>
      <div style="display:flex;gap:var(--space-md);flex-wrap:wrap">
        <label class="mode-option ${a==="timeslot"?"mode-option--active":""}" style="cursor:pointer;display:flex;align-items:flex-start;gap:var(--space-sm);padding:var(--space-md);border:2px solid ${a==="timeslot"?"var(--color-accent)":"var(--color-border)"};border-radius:var(--radius-md);flex:1;min-width:200px">
          <input type="radio" name="vocal-mode" value="timeslot" ${a==="timeslot"?"checked":""} />
          <div>
            <strong>Timeslot Mode</strong>
            <p style="font-size:var(--text-small);color:var(--color-text-secondary);margin:var(--space-xs) 0 0">
              Families pick their own 15-minute vocal audition time slot.
            </p>
          </div>
        </label>
        <label class="mode-option ${a==="day_assignment"?"mode-option--active":""}" style="cursor:pointer;display:flex;align-items:flex-start;gap:var(--space-sm);padding:var(--space-md);border:2px solid ${a==="day_assignment"?"var(--color-accent)":"var(--color-border)"};border-radius:var(--radius-md);flex:1;min-width:200px">
          <input type="radio" name="vocal-mode" value="day_assignment" ${a==="day_assignment"?"checked":""} />
          <div>
            <strong>Day Assignment Mode</strong>
            <p style="font-size:var(--text-small);color:var(--color-text-secondary);margin:var(--space-xs) 0 0">
              Students select role preferences during registration. Director assigns students to audition days.
            </p>
          </div>
        </label>
      </div>
      <div id="mode-msg" class="form-message" aria-live="polite" style="margin-top:var(--space-sm)"></div>
    </div>
  `}function H(){const{role:a}=f();return p.length===0?'<p style="color:var(--color-text-secondary)">No audition roles defined yet. Add one below.</p>':`
    <div class="table-responsive">
    <table class="data-table">
      <thead>
        <tr>
          <th>Order</th>
          <th>Role Name</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        ${p.map(i=>`
          <tr>
            <td>${i.display_order}</td>
            <td>${g(i.name)}</td>
            <td>
              <button class="btn-small" data-edit-role="${i.id}">Edit</button>
              ${B(a)?`<button class="btn-small btn-secondary" data-delete-role="${i.id}">Delete</button>`:""}
            </td>
          </tr>`).join("")}
      </tbody>
    </table>
    </div>
  `}function h(a){const i=a||{},o=!!a,r=p.length>0?Math.max(...p.map(e=>e.display_order))+1:1;return`
    <form id="role-form" class="login-form" style="margin-top:var(--space-md)">
      <h3>${o?"Edit":"Add"} Audition Role</h3>
      ${o?`<input type="hidden" id="role-id" value="${i.id}" />`:""}
      <label for="role-name">Role Name *</label>
      <input type="text" id="role-name" required value="${g(i.name||"")}" placeholder="e.g. Belle, Beast, Ensemble" />
      <label for="role-order">Display Order</label>
      <input type="number" id="role-order" value="${i.display_order??r}" min="0" />
      <button type="submit">${o?"Update":"Add"} Role</button>
      ${o?'<button type="button" id="cancel-role-edit" class="btn-small btn-secondary" style="margin-top:0.25rem">Cancel</button>':""}
      <div id="role-form-msg" class="form-message" aria-live="polite"></div>
    </form>
  `}function q(){const a=b||S;return`
    <div class="card" style="margin-bottom:var(--space-lg)">
      <h2 style="margin-top:0">Registration Schedule Email Template</h2>
      <p style="font-size:var(--text-small);color:var(--color-text-secondary);margin-bottom:var(--space-md)">
        This email is sent automatically when a student completes registration.
      </p>
      <form id="registration-email-template-form" class="login-form" style="max-width:100%">
        <label for="registration-show-title">Title of the Show</label>
        <input type="text" id="registration-show-title" value="${g(a.show_title||"")}" placeholder="Beauty and the Beast" />

        <label for="registration-email-subject">Subject Template</label>
        <input type="text" id="registration-email-subject" value="${g(a.subject_template||"")}" />

        <label for="registration-email-body">Body Template</label>
        <textarea id="registration-email-body" rows="16" style="width:100%;font-family:var(--font-mono);padding:0.75rem">${g(a.body_template||"")}</textarea>

        <p style="font-size:var(--text-xs);color:var(--color-text-muted);margin:0">
          Available placeholders: {{Title of the Show}}, {{Student Name}}, {{Dance Day Date}}, {{Dance Start Time}}, {{Dance End Time}},
          {{Vocal Day Date}}, {{Vocal Start Time}}, {{Vocal End Time}}, {{Callback Date(s)}}, {{Callback Start Time}}, {{Callback End Time}}
        </p>

        <button type="submit">Save Email Template</button>
        <div id="registration-email-template-msg" class="form-message" aria-live="polite"></div>
      </form>
    </div>
  `}function A(a){document.querySelectorAll('input[name="vocal-mode"]').forEach(o=>{o.addEventListener("change",async()=>{const{user:r}=f(),e=document.getElementById("mode-msg"),t=o.value;e&&(e.textContent="Saving…",e.className="form-message");const{data:l,error:s}=await $({vocal_mode:t},r.id);if(s){e&&(e.textContent="Error: "+s.message,e.className="form-message error");return}const d=(l==null?void 0:l.id)||(c==null?void 0:c.id)||null;y("update_vocal_mode","audition_settings",d,{vocal_mode:t}),e&&(e.textContent=`Switched to ${t==="timeslot"?"Timeslot":"Day Assignment"} mode.`,e.className="form-message success"),c=l||{...c||{},vocal_mode:t};const n=document.getElementById("mode-toggle-container");n&&(n.innerHTML=D(),A(a))})}),document.querySelectorAll("[data-edit-role]").forEach(o=>{o.addEventListener("click",()=>{const r=o.getAttribute("data-edit-role"),e=p.find(t=>t.id===r);if(e){const t=document.getElementById("role-form-container");t&&(t.innerHTML=h(e),v(a))}})}),document.querySelectorAll("[data-delete-role]").forEach(o=>{o.addEventListener("click",async()=>{const r=o.getAttribute("data-delete-role"),e=p.find(l=>l.id===r);if(!window.confirm(`Delete role "${(e==null?void 0:e.name)||""}"? This will also remove all student preferences for this role.`))return;o.disabled=!0;const{error:t}=await k(r);if(t){alert("Failed to delete: "+t.message),o.disabled=!1;return}a()})}),v(a);const i=document.getElementById("registration-email-template-form");i&&i.addEventListener("submit",async o=>{var m,E,x,T,w,_;o.preventDefault();const{user:r}=f(),e=document.getElementById("registration-email-template-msg"),t=i.querySelector('button[type="submit"]'),l=((E=(m=document.getElementById("registration-show-title"))==null?void 0:m.value)==null?void 0:E.trim())||"",s=((T=(x=document.getElementById("registration-email-subject"))==null?void 0:x.value)==null?void 0:T.trim())||"",d=((_=(w=document.getElementById("registration-email-body"))==null?void 0:w.value)==null?void 0:_.trim())||"";if(!l||!s||!d){e&&(e.textContent="Show title, subject, and body are required.",e.className="form-message error");return}t.disabled=!0,t.textContent="Saving…",e&&(e.textContent="",e.className="form-message");const{data:n,error:u}=await L({show_title:l,subject_template:s,body_template:d},r.id);if(t.disabled=!1,t.textContent="Save Email Template",u){e&&(e.textContent="Error: "+u.message,e.className="form-message error");return}b=n||{show_title:l,subject_template:s,body_template:d},y("update_registration_email_template","registration_email_templates",(n==null?void 0:n.id)||null,{show_title:l}),e&&(e.textContent="Template saved.",e.className="form-message success")})}function v(a){const i=document.getElementById("role-form");if(!i)return;const o=document.getElementById("cancel-role-edit");o&&o.addEventListener("click",()=>{const r=document.getElementById("role-form-container");r&&(r.innerHTML=h(null),v(a))}),i.addEventListener("submit",async r=>{r.preventDefault();const{user:e}=f(),t=document.getElementById("role-form-msg"),l=i.querySelector('button[type="submit"]'),s=document.getElementById("role-id"),d=!!s,n=document.getElementById("role-name").value.trim(),u=parseInt(document.getElementById("role-order").value,10)||0;if(!n){t&&(t.textContent="Role name is required.",t.className="form-message error");return}l.disabled=!0,l.textContent="Saving…",t&&(t.textContent="");let m;if(d?m=await N(s.value,{name:n,display_order:u},e.id):m=await M(n,u,e.id),m.error){t&&(t.textContent="Error: "+m.error.message,t.className="form-message error"),l.disabled=!1,l.textContent=d?"Update Role":"Add Role";return}d?y("update_role","audition_roles",s.value,{name:n,display_order:u}):m.data&&y("create_role","audition_roles",m.data.id,{name:n,display_order:u}),t&&(t.textContent=d?"Updated!":"Added!",t.className="form-message success"),setTimeout(()=>a(),300)})}function F(){const a=document.createElement("div");a.className="page",a.innerHTML=`
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:var(--space-md)">
      <h1 style="margin:0">Audition Roles</h1>
      <button class="btn-ghost" onclick="location.hash='#/staff'" style="min-height:auto;width:auto">← Dashboard</button>
    </div>
    <div id="mode-toggle-container"></div>
    <div id="registration-email-template-container"></div>
    <div class="card" style="margin-bottom:var(--space-lg)">
      <h2 style="margin-top:0">Roles</h2>
      <p style="font-size:var(--text-small);color:var(--color-text-secondary);margin-bottom:var(--space-md)">
        Define the roles students can audition for. Students will rank these during registration when Day Assignment mode is active.
      </p>
      <div id="roles-table"><p>Loading…</p></div>
    </div>
    <div class="card" id="role-form-container"></div>
  `;async function i(){await j();const o=document.getElementById("mode-toggle-container"),r=document.getElementById("registration-email-template-container"),e=document.getElementById("roles-table"),t=document.getElementById("role-form-container");o&&(o.innerHTML=D()),r&&(r.innerHTML=q()),e&&(e.innerHTML=H()),t&&(t.innerHTML=h(null)),A(i)}return setTimeout(i,0),a}export{F as renderStaffRoleConfig};
