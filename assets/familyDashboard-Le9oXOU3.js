import{g as x}from"./index-CvLlIQq8.js";import{f as b}from"./students-BdMRccDH.js";import{f as k,a as w}from"./contracts-CHxjH8lw.js";import{f as D}from"./scheduling-DUsTW120.js";import{f as S}from"./vocalBookings-DdAfK_Ri.js";import{f as q,a as A}from"./rolePreferences-CjF-1O--.js";import{i as V}from"./rolePreferences-B9XCX_X4.js";import{e as B}from"./registration-BJf__55_.js";import{f as _,a as u}from"./scheduling-DSZ8OVmG.js";import{e as c}from"./escapeHtml-lW1fV86Q.js";async function C(e){const[i,s,t,r]=await Promise.all([b(e),k(),D(),q()]),n=i.data||[],a=s.data,l=(a==null?void 0:a.id)||null,p=t.data||[],m=V(r.data),v=p.filter(o=>o.dance_start_time&&o.dance_end_time);return{students:await Promise.all(n.map(async o=>{const[{data:g},{data:f},{data:y}]=await Promise.all([w(o.id),m?Promise.resolve({data:null}):S(o.id),m?A(o.id):Promise.resolve({data:null})]),d=B(o,g||[],l);return{...o,registrationStatus:d,danceWindows:v,hasDanceAssigned:v.length>0,vocalBooking:f,vocalDayAssignment:y}})),activeContract:a,dayMode:m}}function R(e,i,s){if(e.length===0)return{icon:"🌹",title:"Get started!",message:"You haven't registered any students yet.",href:"#/family/register"};const t=e.find(a=>!a.registrationStatus.complete);if(t){const a=t.registrationStatus.missing;return a.some(l=>l.includes("Contract"))?{icon:"📋",title:"Contract unsigned",message:`${c(t.first_name)} needs a signed contract.`,href:"#/family/contract"}:{icon:"⏳",title:"Registration incomplete",message:`${c(t.first_name)} still needs: ${a.join(", ")}.`,href:"#/family/register"}}const r=e.find(a=>!a.hasDanceAssigned);if(r)return{icon:"🎵",title:"Dance schedule pending",message:`${c(r.first_name)} is waiting on assigned dance day/time.`,href:"#/family/dance"};const n=s?e.find(a=>!a.vocalDayAssignment):e.find(a=>!a.vocalBooking);return n?s?{icon:"🎤",title:"Vocal day pending",message:`${c(n.first_name)} is waiting on a role-based vocal day assignment.`,href:"#/family/vocal"}:{icon:"🎤",title:"Book vocal audition",message:`${c(n.first_name)} doesn't have a vocal slot yet.`,href:"#/family/vocal"}:{icon:"🌹",title:"You're all set!",message:"All students are registered and assigned. Break a leg!",href:null}}function z(e,i){const{registrationStatus:s,danceWindows:t,hasDanceAssigned:r,vocalBooking:n,vocalDayAssignment:a}=e,l=s.complete?"success-box":"warning-box",p=`${(e.first_name||"?")[0]}${(e.last_name||"?")[0]}`.toUpperCase(),m=s.complete?'<span class="status-badge--complete">✓ Registered</span>':'<span class="status-badge--pending">⏳ Incomplete</span>',v=r?'<span class="status-badge--complete">✓ Dance</span>':'<span class="status-badge--locked">— Dance</span>',$=i?a?'<span class="status-badge--complete">✓ Vocal Day</span>':'<span class="status-badge--locked">— Vocal Day</span>':n?'<span class="status-badge--complete">✓ Vocal</span>':'<span class="status-badge--locked">— Vocal</span>';let o="";t&&t.length>0&&(o=`🎵 Dance (required): ${t.map(h=>`${_(h.audition_date)} ${u(h.dance_start_time)} – ${u(h.dance_end_time)}`).join("; ")}`);let g="";if(i&&a)g=`🎤 Vocal Day: ${_(a.audition_date)}`;else if(!i&&n&&n.audition_slots){const d=n.audition_slots;g=`🎤 Vocal: ${_(d.audition_date)} ${u(d.start_time)} – ${u(d.end_time)}`}let f="";s.complete?r?(i&&!a||!i&&!n)&&(f=i?'<a href="#/family/vocal" style="font-weight:600;font-size:var(--text-small)">View vocal day assignment →</a>':'<a href="#/family/vocal" style="font-weight:600;font-size:var(--text-small)">Book vocal slot →</a>'):f='<a href="#/family/dance" style="font-weight:600;font-size:var(--text-small)">View dance assignment →</a>':f='<a href="#/family/register" style="font-weight:600;font-size:var(--text-small)">Complete registration →</a>';const y=`#/family/register?studentId=${encodeURIComponent(e.id)}`;return`
    <div class="student-card ${l}">
      <div style="display:flex;align-items:center;gap:var(--space-md);margin-bottom:var(--space-sm)">
        <div class="avatar">${p}</div>
        <div>
          <h3 style="margin:0">${c(e.first_name||"Unnamed")} ${c(e.last_name||"Student")}</h3>
          <span style="font-size:var(--text-small);color:var(--color-text-secondary)">Grade ${c(e.grade||"—")}</span>
        </div>
      </div>
      <div style="display:flex;flex-wrap:wrap;gap:var(--space-xs);margin-bottom:var(--space-sm)">
        ${m} ${v} ${$}
      </div>
      ${e.callback_invited?'<p style="color:var(--color-success);font-weight:600;font-size:var(--text-small)">⭐ Invited to Callbacks</p>':""}
      ${o?`<p style="font-size:var(--text-small);color:var(--color-text-secondary)">${c(o)}</p>`:""}
      ${g?`<p style="font-size:var(--text-small);color:var(--color-text-secondary)">${c(g)}</p>`:""}
      ${s.complete?"":`<div style="font-size:var(--text-small);margin-top:var(--space-xs)"><strong>Missing:</strong><ul style="margin:0.25rem 0 0 1.25rem;padding:0">${s.missing.map(d=>`<li>${d}</li>`).join("")}</ul></div>`}
      <div style="margin-top:var(--space-sm)">
        <a
          href="${y}"
          data-edit-registration="${c(e.id)}"
          style="font-weight:600;font-size:var(--text-small)"
        >Edit registration →</a>
      </div>
      ${f?`<div style="margin-top:var(--space-sm)">${f}</div>`:""}
    </div>
  `}function N(){const{user:e}=x(),i=document.createElement("div");return i.className="page",i.innerHTML=`
    <h1>Family Dashboard 🌹</h1>
    <div id="students-list"><p>Loading…</p></div>
  `,setTimeout(async()=>{if(!e)return;const s=document.getElementById("students-list");if(s)try{const{students:t,activeContract:r,dayMode:n}=await C(e.id),a=R(t,r,n),l=`
        <div class="enchanted-banner">
          <div class="enchanted-banner__icon">${a.icon}</div>
          <div class="enchanted-banner__content">
            <div class="enchanted-banner__title">${a.title}</div>
            <div class="enchanted-banner__message">${a.message}</div>
            ${a.href?`<a class="enchanted-banner__link" href="${a.href}">Get started →</a>`:""}
          </div>
        </div>
      `;if(t.length===0)s.innerHTML=`
          ${l}
          <div style="text-align:center;padding:var(--space-2xl) 0;color:var(--color-text-secondary)">
            <div style="font-size:2rem;margin-bottom:var(--space-md)">🌹</div>
            <p>No students registered yet.</p>
            <a href="#/family/register" class="btn-accent" style="margin-top:var(--space-md);display:inline-flex">Register your first student</a>
          </div>
        `;else{const p=`
          <div class="quick-actions">
            <a href="#/family/register" class="quick-action">
              <span class="quick-action__icon">📋</span>
              <span class="quick-action__text">Register</span>
            </a>
            <a href="#/family/dance" class="quick-action">
              <span class="quick-action__icon">🎵</span>
              <span class="quick-action__text">Dance Schedule</span>
            </a>
            <a href="#/family/vocal" class="quick-action">
              <span class="quick-action__icon">🎤</span>
              <span class="quick-action__text">Vocal Booking</span>
            </a>
            <a href="#/family/schedule" class="quick-action">
              <span class="quick-action__icon">📅</span>
              <span class="quick-action__text">View Schedule</span>
            </a>
          </div>
        `;s.innerHTML=`
          ${l}
          ${p}
          <h2>Your Students</h2>
          ${t.map(m=>z(m,n)).join("")}
        `}}catch(t){console.error("Failed loading family dashboard:",t),s.innerHTML=`
        <div class="warning-box student-card">
          <strong>Could not load dashboard</strong>
          <p style="margin-top:var(--space-xs)">Please refresh and try again.</p>
          <p style="margin-top:var(--space-xs)"><a href="#/family">Retry</a></p>
        </div>
      `}},0),i}export{N as renderFamilyDashboard};
