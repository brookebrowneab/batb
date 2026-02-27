import { signInWithPassword } from '../adapters/auth.js';
import { validateLoginEmail } from '../domain/emailValidation.js';

export function renderStaffLogin() {
  const container = document.createElement('div');
  container.className = 'page';
  container.innerHTML = `
    <h1>Staff Login</h1>
    <p>Sign in with your staff credentials.</p>
    <form id="staff-login-form" class="login-form">
      <label for="staff-email">Email</label>
      <input type="email" id="staff-email" name="email" required placeholder="staff@example.com" />
      <label for="staff-password">Password</label>
      <input type="password" id="staff-password" name="password" required />
      <button type="submit">Sign In</button>
      <div id="staff-login-message" class="form-message" aria-live="polite"></div>
    </form>
  `;

  setTimeout(() => {
    const form = document.getElementById('staff-login-form');
    if (!form) return;
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('staff-email').value.trim();
      const password = document.getElementById('staff-password').value;
      const msg = document.getElementById('staff-login-message');
      const btn = form.querySelector('button');

      if (!email || !password) return;

      const validation = validateLoginEmail(email);
      if (!validation.valid) {
        msg.textContent = validation.error;
        msg.className = 'form-message error';
        return;
      }

      btn.disabled = true;
      btn.textContent = 'Signing in…';
      msg.textContent = '';
      msg.className = 'form-message';

      const { error } = await signInWithPassword(email, password);

      if (error) {
        msg.textContent = 'Invalid credentials. Please try again.';
        msg.className = 'form-message error';
        btn.disabled = false;
        btn.textContent = 'Sign In';
        return;
      }

      // Full reload — initAuth on page load will pick up the session and role
      window.location.hash = '#/admin';
      window.location.reload();
    });
  }, 0);

  return container;
}
