import{g as t}from"./index-DB_Xnewy.js";import{e as i}from"./escapeHtml-lW1fV86Q.js";function l(){const{user:a,staffProfile:s}=t(),n=(s==null?void 0:s.display_name)||(a==null?void 0:a.email)||"admin",c=document.createElement("div");return c.className="page",c.innerHTML=`
    <div style="margin-bottom:var(--space-xl)">
      <h1>Admin Dashboard 🎭</h1>
      <p>Welcome, ${i(n)}.</p>
    </div>

    <div class="quick-actions" style="margin-bottom:var(--space-xl)">
      <a href="#/admin/contracts" class="quick-action">
        <span class="quick-action__icon">📋</span>
        <span class="quick-action__text">Contracts</span>
      </a>
      <a href="#/admin/registrations" class="quick-action">
        <span class="quick-action__icon">👥</span>
        <span class="quick-action__text">Registrations</span>
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
    </div>

    <h2>Management</h2>
    <ul class="admin-links">
      <li><a href="#/admin/contracts">Contract Management</a></li>
      <li><a href="#/admin/registrations">Student Registrations</a></li>
      <li><a href="#/staff/dance-roster">Dance Roster & Overrides</a></li>
      <li><a href="#/staff/vocal-roster">Vocal Roster & Overrides</a></li>
      <li><a href="#/staff/callbacks">Callback Management</a></li>
    </ul>
  `,c}export{l as renderAdminDashboard};
