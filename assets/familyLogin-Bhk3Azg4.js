import{s as k,b as L,c as N}from"./index-BW_ouStE.js";import{v as p}from"./emailValidation-DoK9MuSU.js";function M(){var h,v,w,S;const e=document.createElement("div");e.className="page",e.innerHTML=`
    <div class="login-card">
      <h2 id="family-login-heading">Welcome back! 🌹</h2>
      <p id="family-login-intro" style="text-align:center;color:var(--color-text-secondary);margin-bottom:var(--space-lg);font-size:var(--text-small)">
        Sign in to manage your student's audition registration.
      </p>

      <form id="family-password-form" class="login-form">
        <label for="family-pw-email">Email address</label>
        <input type="email" id="family-pw-email" name="email" required placeholder="parent@example.com" />
        <label for="family-pw-password">Password</label>
        <input type="password" id="family-pw-password" name="password" required />
        <button type="submit">Sign In</button>
        <div id="family-pw-msg" class="form-message" aria-live="polite"></div>
      </form>

      <div class="login-alt-links">
        <button type="button" class="link-btn" id="show-signup-toggle">Create an account</button>
        <button type="button" class="link-btn" id="show-magic-toggle">Use a magic link</button>
      </div>

      <div id="family-signup-section" class="login-alt-section" hidden>
        <h2>Create Account</h2>
        <form id="family-signup-form" class="login-form">
          <label for="family-signup-email">Email address</label>
          <input type="email" id="family-signup-email" name="email" required placeholder="parent@example.com" />
          <label for="family-signup-password">Password</label>
          <input type="password" id="family-signup-password" name="password" required minlength="6" />
          <label for="family-signup-confirm">Confirm Password</label>
          <input type="password" id="family-signup-confirm" name="confirm" required minlength="6" />
          <button type="submit">Create Account</button>
          <div id="family-signup-msg" class="form-message" aria-live="polite"></div>
        </form>
        <button type="button" class="link-btn" id="hide-signup-toggle">Back to sign in</button>
      </div>

      <div id="family-magic-section" class="login-alt-section" hidden>
        <h2>Magic Link</h2>
        <p style="font-size:var(--text-small);color:var(--color-text-secondary);margin-bottom:var(--space-sm)">
          We'll email you a sign-in link — no password needed.
        </p>
        <form id="family-magic-form" class="login-form">
          <label for="family-magic-email">Email address</label>
          <input type="email" id="family-magic-email" name="email" required placeholder="parent@example.com" />
          <button type="submit">Send Magic Link</button>
          <div id="family-magic-msg" class="form-message" aria-live="polite"></div>
        </form>
        <button type="button" class="link-btn" id="hide-magic-toggle">Back to sign in</button>
      </div>
    </div>
  `;const o=e.querySelector("#family-password-form"),d=e.querySelector("#family-login-heading"),u=e.querySelector("#family-login-intro"),g=e.querySelector(".login-alt-links"),f=e.querySelector("#family-signup-section"),y=e.querySelector("#family-magic-section");function b(){d.hidden=!1,u.hidden=!1,o.hidden=!1,g.hidden=!1,f.hidden=!0,y.hidden=!0}function x(){d.hidden=!0,u.hidden=!0,o.hidden=!0,g.hidden=!0,f.hidden=!1,y.hidden=!0}function C(){d.hidden=!0,u.hidden=!0,o.hidden=!0,g.hidden=!0,f.hidden=!0,y.hidden=!1}(h=e.querySelector("#show-signup-toggle"))==null||h.addEventListener("click",x),(v=e.querySelector("#show-magic-toggle"))==null||v.addEventListener("click",C),(w=e.querySelector("#hide-signup-toggle"))==null||w.addEventListener("click",b),(S=e.querySelector("#hide-magic-toggle"))==null||S.addEventListener("click",b),o==null||o.addEventListener("submit",async r=>{r.preventDefault();const s=e.querySelector("#family-pw-email").value.trim(),i=e.querySelector("#family-pw-password").value,a=e.querySelector("#family-pw-msg"),t=o.querySelector('button[type="submit"]'),n=p(s);if(!n.valid){a.textContent=n.error,a.className="form-message error";return}if(!i)return;t.disabled=!0,t.textContent="Signing in…",a.textContent="",a.className="form-message";const{error:l}=await k(s,i);l?(a.textContent=l.message||"Login failed. Please try again.",a.className="form-message error",t.disabled=!1,t.textContent="Sign In"):(window.location.hash="#/family",window.location.reload())});const m=e.querySelector("#family-magic-form");m==null||m.addEventListener("submit",async r=>{r.preventDefault();const s=e.querySelector("#family-magic-email").value.trim(),i=e.querySelector("#family-magic-msg"),a=m.querySelector("button"),t=p(s);if(!t.valid){i.textContent=t.error,i.className="form-message error";return}a.disabled=!0,a.textContent="Sending…",i.textContent="",i.className="form-message";const{error:n}=await L(s);n?(i.textContent="Failed to send link. Please try again.",i.className="form-message error"):(i.textContent="Check your email for a sign-in link!",i.className="form-message success"),a.disabled=!1,a.textContent="Send Magic Link"});const c=e.querySelector("#family-signup-form");return c==null||c.addEventListener("submit",async r=>{r.preventDefault();const s=e.querySelector("#family-signup-email").value.trim(),i=e.querySelector("#family-signup-password").value,a=e.querySelector("#family-signup-confirm").value,t=e.querySelector("#family-signup-msg"),n=c.querySelector("button"),l=p(s);if(!l.valid){t.textContent=l.error,t.className="form-message error";return}if(!i||!a)return;if(i!==a){t.textContent="Passwords do not match.",t.className="form-message error";return}if(i.length<6){t.textContent="Password must be at least 6 characters.",t.className="form-message error";return}n.disabled=!0,n.textContent="Creating account…",t.textContent="",t.className="form-message";const{error:q}=await N(s,i);q?(t.textContent=q.message||"Sign-up failed. Please try again.",t.className="form-message error",n.disabled=!1,n.textContent="Create Account"):(t.textContent="Account created! Check your email for a confirmation link, then sign in.",t.className="form-message success",n.disabled=!1,n.textContent="Create Account")}),e}export{M as renderFamilyLogin};
