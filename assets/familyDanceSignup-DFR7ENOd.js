import{g as p}from"./index-CjpvKVl5.js";import{f}from"./students-cixm4_-c.js";import{f as u}from"./scheduling-C7HHNMXp.js";import{f as g,a as d}from"./scheduling-DSZ8OVmG.js";import{e as o}from"./escapeHtml-lW1fV86Q.js";function v(e){return(e||[]).filter(t=>t.dance_start_time&&t.dance_end_time)}function $(){const e=document.createElement("div");return e.className="page",e.innerHTML=`
    <p><a href="#/family">← Back to Dashboard</a></p>
    <h1>Dance Audition Schedule 🎵</h1>
    <p style="margin-bottom:var(--space-md)">
      Dance is required for all students. Families do not sign up for dance slots.
      The production team assigns the dance day and time.
    </p>
    <div id="dance-content"><p>Loading…</p></div>
  `,setTimeout(async()=>{const{user:t}=p();if(!t)return;const a=document.getElementById("dance-content");if(!a)return;const[c,m]=await Promise.all([f(t.id),u()]),i=c.data||[],r=v(m.data||[]);if(i.length===0){a.innerHTML='<div class="placeholder-notice">No students registered yet. <a href="#/family/register">Start registration</a>.</div>';return}if(r.length===0){a.innerHTML=`
        <div class="placeholder-notice">
          Dance day/time has not been posted yet. Check back soon.
        </div>
      `;return}const l=i.map(n=>`
      <div class="card" style="margin-bottom:var(--space-md)">
        <div style="display:flex;align-items:center;gap:var(--space-sm);margin-bottom:var(--space-sm)">
          <div class="avatar">${(n.first_name||"?")[0]}${(n.last_name||"?")[0]}</div>
          <h3 style="margin:0">${o(n.first_name||"Unnamed")} ${o(n.last_name||"Student")}</h3>
        </div>
        <div class="success-box" style="padding:var(--space-sm) var(--space-md);border-radius:var(--radius-sm)">
          <p style="font-size:var(--text-small);margin:0 0 var(--space-xs)"><strong>Assigned Dance Windows (Required):</strong></p>
          <ul style="margin:0;padding-left:1rem;font-size:var(--text-small)">
            ${r.map(s=>`
              <li>${g(s.audition_date)} — ${d(s.dance_start_time)} – ${d(s.dance_end_time)}</li>
            `).join("")}
          </ul>
        </div>
      </div>
    `).join("");a.innerHTML=l},0),e}export{$ as renderFamilyDanceSignup};
