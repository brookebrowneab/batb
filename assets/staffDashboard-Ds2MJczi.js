import{g as e}from"./index-DeRKeswm.js";import{e as n}from"./escapeHtml-lW1fV86Q.js";function r(){const{user:a,role:i,staffProfile:s}=e(),t=(s==null?void 0:s.display_name)||(a==null?void 0:a.email)||"staff",c=document.createElement("div");return c.className="page",c.innerHTML=`
    <div style="margin-bottom:var(--space-xl)">
      <h1>Welcome back, ${n(t)} 🎭</h1>
      <span class="badge active" style="font-size:var(--text-xs)">${n(i)}</span>
    </div>

    <div class="quick-actions" style="margin-bottom:var(--space-xl)">
      <a href="#/staff/scheduling" class="quick-action">
        <span class="quick-action__icon">📅</span>
        <span class="quick-action__text">Scheduling</span>
      </a>
      <a href="#/staff/dance-roster" class="quick-action">
        <span class="quick-action__icon">🎵</span>
        <span class="quick-action__text">Dance Roster</span>
      </a>
      <a href="#/staff/vocal-roster" class="quick-action">
        <span class="quick-action__icon">🎤</span>
        <span class="quick-action__text">Vocal Roster</span>
      </a>
      <a href="#/staff/callbacks" class="quick-action">
        <span class="quick-action__icon">⭐</span>
        <span class="quick-action__text">Callbacks</span>
      </a>
      <a href="#/staff/roles" class="quick-action">
        <span class="quick-action__icon">🎭</span>
        <span class="quick-action__text">Audition Roles</span>
      </a>
      <a href="#/staff/vocal-assignments" class="quick-action">
        <span class="quick-action__icon">📋</span>
        <span class="quick-action__text">Vocal Assignments</span>
      </a>
    </div>

    <h2>Quick Links</h2>
    <ul class="admin-links">
      <li><a href="#/staff/scheduling">Scheduling Configuration</a></li>
      <li><a href="#/staff/dance-roster">Dance Roster</a></li>
      <li><a href="#/staff/vocal-roster">Vocal Roster</a></li>
      <li><a href="#/staff/callbacks">Callback Management</a></li>
      <li><a href="#/staff/roles">Audition Roles</a></li>
      <li><a href="#/staff/vocal-assignments">Vocal Assignments</a></li>
    </ul>
  `,c}export{r as renderStaffDashboard};
