import { signInWithMagicLink } from '../adapters/auth.js';

export function renderFamilyLogin() {
  const container = document.createElement('div');
  container.className = 'page';
  container.innerHTML = `
    <h1>Family Login</h1>
    <p>Enter your email address and we'll send you a sign-in link.</p>
    <form id="family-login-form" class="login-form">
      <label for="family-email">Email address</label>
      <input type="email" id="family-email" name="email" required placeholder="parent@example.com" />
      <button type="submit">Send Magic Link</button>
      <div id="family-login-message" class="form-message" aria-live="polite"></div>
    </form>
  `;

  setTimeout(() => {
    const form = document.getElementById('family-login-form');
    if (!form) return;
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('family-email').value.trim();
      const msg = document.getElementById('family-login-message');
      const btn = form.querySelector('button');

      if (!email) return;

      btn.disabled = true;
      btn.textContent = 'Sending…';
      msg.textContent = '';
      msg.className = 'form-message';

      const { error } = await signInWithMagicLink(email);

      if (error) {
        msg.textContent = 'Failed to send link. Please try again.';
        msg.className = 'form-message error';
      } else {
        msg.textContent = 'Check your email for a sign-in link!';
        msg.className = 'form-message success';
      }
      btn.disabled = false;
      btn.textContent = 'Send Magic Link';
    });
  }, 0);

  return container;
}
