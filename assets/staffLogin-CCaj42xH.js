import{s as m}from"./index-CjmOQxOe.js";import{v as f}from"./emailValidation-DoK9MuSU.js";function g(){const a=document.createElement("div");return a.className="page",a.innerHTML=`
    <div class="login-card">
      <h2>Staff Login 🎭</h2>
      <p style="text-align:center;color:var(--color-text-secondary);margin-bottom:var(--space-lg);font-size:var(--text-small)">
        Sign in with your staff credentials.
      </p>
      <form id="staff-login-form" class="login-form">
        <label for="staff-email">Email</label>
        <input type="email" id="staff-email" name="email" required placeholder="staff@example.com" />
        <label for="staff-password">Password</label>
        <input type="password" id="staff-password" name="password" required />
        <button type="submit">Sign In</button>
        <div id="staff-login-message" class="form-message" aria-live="polite"></div>
      </form>
    </div>
  `,setTimeout(()=>{const n=document.getElementById("staff-login-form");n&&n.addEventListener("submit",async i=>{i.preventDefault();const s=document.getElementById("staff-email").value.trim(),o=document.getElementById("staff-password").value,e=document.getElementById("staff-login-message"),t=n.querySelector("button");if(!s||!o)return;const r=f(s);if(!r.valid){e.textContent=r.error,e.className="form-message error";return}t.disabled=!0,t.textContent="Signing in…",e.textContent="",e.className="form-message";const{error:l}=await m(s,o);if(l){e.textContent="Invalid credentials. Please try again.",e.className="form-message error",t.disabled=!1,t.textContent="Sign In";return}window.location.hash="#/staff",window.location.reload()})},0),a}export{g as renderStaffLogin};
