import{g as _}from"./index-DB_Xnewy.js";import{f as b}from"./scheduling-B2ki5TeN.js";import{f as $}from"./students-VK94Ci_a.js";import{f as g,a}from"./scheduling-DSZ8OVmG.js";import{i as x}from"./callbacks-C7GiSGW7.js";import{f as k,a as A}from"./rolePreferences-ETjakyug.js";import{i as S}from"./rolePreferences-B9XCX_X4.js";import{e as o}from"./escapeHtml-lW1fV86Q.js";function L(){const r=document.createElement("div");return r.className="page",r.innerHTML=`
    <p><a href="#/family">← Back to Dashboard</a></p>
    <h1>Audition Schedule 📅</h1>
    <div id="schedule-content"><p>Loading…</p></div>
  `,setTimeout(async()=>{const{user:c}=_();if(!c)return;const[f,u,h]=await Promise.all([b(),$(c.id),k()]),m=f.data||[],s=u.data||[],y=h.data,d=document.getElementById("schedule-content");if(!d)return;if(m.length===0){d.innerHTML=`
        <div style="text-align:center;padding:var(--space-2xl) 0;color:var(--color-text-secondary)">
          <div style="font-size:2rem;margin-bottom:var(--space-md)">📅</div>
          <p>Audition dates have not been announced yet.</p>
          <p style="font-size:var(--text-small);margin-top:var(--space-sm)">Check back later for the schedule.</p>
        </div>
      `;return}const p=S(y),i={};p&&await Promise.all(s.map(async t=>{const{data:n}=await A(t.id);n&&(i[t.id]=n)}));const v=s.some(t=>x(t));let l="";if(p&&s.length>0){const t=s.filter(e=>i[e.id]),n=s.filter(e=>!i[e.id]);t.length>0&&(l+=`
          <div class="success-box" style="padding:var(--space-md);border-radius:var(--radius-sm);margin-bottom:var(--space-md)">
            <strong>Vocal Audition Day Assignments</strong>
            ${t.map(e=>`
              <p style="font-size:var(--text-small);margin:var(--space-xs) 0 0">
                ${o(e.first_name||"")} ${o(e.last_name||"")}: <strong>${g(i[e.id].audition_date)}</strong>
              </p>
            `).join("")}
          </div>
        `),n.length>0&&(l+=`
          <div class="placeholder-notice" style="margin-bottom:var(--space-md)">
            ${n.map(e=>`${o(e.first_name||"")} ${o(e.last_name||"")}`).join(", ")}
            — awaiting vocal audition day assignment.
          </div>
        `)}d.innerHTML=`
      ${l}
      ${m.map(t=>`
        <div class="card" style="margin-bottom:var(--space-md)">
          <h3 style="margin-bottom:var(--space-sm)">${g(t.audition_date)}</h3>
          <div style="display:flex;flex-direction:column;gap:var(--space-xs)">
            ${t.dance_start_time?`<p style="font-size:var(--text-small)"><span style="margin-right:var(--space-sm)">🎵</span><strong>Dance:</strong> ${a(t.dance_start_time)} – ${a(t.dance_end_time)}</p>`:""}
            ${t.vocal_start_time?`<p style="font-size:var(--text-small)"><span style="margin-right:var(--space-sm)">🎤</span><strong>Vocal:</strong> ${a(t.vocal_start_time)} – ${a(t.vocal_end_time)}</p>`:""}
            ${v&&t.callback_start_time?`<p style="font-size:var(--text-small)"><span style="margin-right:var(--space-sm)">⭐</span><strong>Callbacks:</strong> ${a(t.callback_start_time)} – ${a(t.callback_end_time)}</p>`:""}
          </div>
        </div>
      `).join("")}
      ${v?'<div class="enchanted-banner" style="margin-top:var(--space-md)"><div class="enchanted-banner__icon">⭐</div><div class="enchanted-banner__content"><div class="enchanted-banner__title">Callbacks!</div><div class="enchanted-banner__message">One or more of your students has been invited to callbacks! See the times listed above.</div></div></div>':""}
      <p class="lock-time-notice" style="margin-top:var(--space-md)">
        Dance and vocal schedules are assigned by staff. Contact the production team for schedule questions.
      </p>
    `},0),r}export{L as renderFamilySchedule};
