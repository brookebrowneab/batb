import{g as t,i as n,a as o}from"./index-BKdYyjDr.js";function l(){const{session:e,role:i}=t();let a;if(!e)a=`
      <div class="hero-actions">
        <a href="#/family/login" class="btn-accent">Family Login</a>
        <a href="#/staff/login" class="btn-primary">Staff Login</a>
      </div>
    `;else{const s=['<a href="#/family" class="btn-accent">Family Dashboard</a>'];n(i)&&s.push('<a href="#/staff" class="btn-primary">Staff Dashboard</a>'),o(i)&&s.push('<a href="#/admin" class="btn-ghost">Admin Dashboard</a>'),a=`
      <p style="margin-bottom:var(--space-md)">You are signed in.</p>
      <nav class="home-actions">${s.join("")}</nav>
    `}return e?`
    <div class="page">
      <h1>Beauty and the Beast Auditions 🌹</h1>
      <p>Welcome back! Manage your audition registration and schedule below.</p>
      ${a}
    </div>
  `:`
      <div class="page">
        <div class="hero-section">
          <h1>Beauty and the Beast</h1>
          <p>Register your student, sign up for audition slots, and track your schedule — all in one place.</p>
          <div class="tagline">Be our guest! 🌹</div>
          ${a}
        </div>
      </div>
    `}export{l as renderHome};
