import { signInWithMagicLink, signInWithPassword, signUpWithPassword } from '../adapters/auth.js';
import { validateLoginEmail } from '../domain/emailValidation.js';

export function renderFamilyLogin() {
  const container = document.createElement('div');
  container.className = 'page';
  container.innerHTML = `
    <h1>Family Login</h1>
    <p>Sign in to manage your student's audition registration.</p>

    <form id="family-password-form" class="login-form">
      <label for="family-pw-email">Email address</label>
      <input type="email" id="family-pw-email" name="email" required placeholder="parent@example.com" />
      <label for="family-pw-password">Password</label>
      <input type="password" id="family-pw-password" name="password" required />
      <button type="submit">Sign In</button>
      <div id="family-pw-msg" class="form-message" aria-live="polite"></div>
    </form>

    <div class="login-alt-links">
      <button type="button" class="link-btn" id="show-signup-toggle">New here? Create an account</button>
      <button type="button" class="link-btn" id="show-magic-toggle">Prefer passwordless? Use a magic link</button>
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
      <p>We'll email you a sign-in link — no password needed.</p>
      <form id="family-magic-form" class="login-form">
        <label for="family-magic-email">Email address</label>
        <input type="email" id="family-magic-email" name="email" required placeholder="parent@example.com" />
        <button type="submit">Send Magic Link</button>
        <div id="family-magic-msg" class="form-message" aria-live="polite"></div>
      </form>
      <button type="button" class="link-btn" id="hide-magic-toggle">Back to sign in</button>
    </div>
  `;

  setTimeout(() => {
    const mainForm = document.getElementById('family-password-form');
    const altLinks = container.querySelector('.login-alt-links');
    const signupSection = document.getElementById('family-signup-section');
    const magicSection = document.getElementById('family-magic-section');

    // Toggle helpers
    function showMain() {
      mainForm.hidden = false;
      altLinks.hidden = false;
      signupSection.hidden = true;
      magicSection.hidden = true;
    }
    function showSignup() {
      mainForm.hidden = true;
      altLinks.hidden = true;
      signupSection.hidden = false;
      magicSection.hidden = true;
    }
    function showMagic() {
      mainForm.hidden = true;
      altLinks.hidden = true;
      signupSection.hidden = true;
      magicSection.hidden = false;
    }

    document.getElementById('show-signup-toggle')?.addEventListener('click', showSignup);
    document.getElementById('show-magic-toggle')?.addEventListener('click', showMagic);
    document.getElementById('hide-signup-toggle')?.addEventListener('click', showMain);
    document.getElementById('hide-magic-toggle')?.addEventListener('click', showMain);

    // Password sign-in
    if (mainForm) {
      mainForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('family-pw-email').value.trim();
        const password = document.getElementById('family-pw-password').value;
        const msg = document.getElementById('family-pw-msg');
        const btn = mainForm.querySelector('button[type="submit"]');

        const validation = validateLoginEmail(email);
        if (!validation.valid) {
          msg.textContent = validation.error;
          msg.className = 'form-message error';
          return;
        }

        if (!password) return;

        btn.disabled = true;
        btn.textContent = 'Signing in…';
        msg.textContent = '';
        msg.className = 'form-message';

        const { error } = await signInWithPassword(email, password);

        if (error) {
          msg.textContent = error.message || 'Login failed. Please try again.';
          msg.className = 'form-message error';
          btn.disabled = false;
          btn.textContent = 'Sign In';
        } else {
          window.location.hash = '#/family';
          window.location.reload();
        }
      });
    }

    // Magic link
    const magicForm = document.getElementById('family-magic-form');
    if (magicForm) {
      magicForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('family-magic-email').value.trim();
        const msg = document.getElementById('family-magic-msg');
        const btn = magicForm.querySelector('button');

        const validation = validateLoginEmail(email);
        if (!validation.valid) {
          msg.textContent = validation.error;
          msg.className = 'form-message error';
          return;
        }

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
    }

    // Sign-up
    const signupForm = document.getElementById('family-signup-form');
    if (signupForm) {
      signupForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('family-signup-email').value.trim();
        const password = document.getElementById('family-signup-password').value;
        const confirm = document.getElementById('family-signup-confirm').value;
        const msg = document.getElementById('family-signup-msg');
        const btn = signupForm.querySelector('button');

        const validation = validateLoginEmail(email);
        if (!validation.valid) {
          msg.textContent = validation.error;
          msg.className = 'form-message error';
          return;
        }

        if (!password || !confirm) return;

        if (password !== confirm) {
          msg.textContent = 'Passwords do not match.';
          msg.className = 'form-message error';
          return;
        }

        if (password.length < 6) {
          msg.textContent = 'Password must be at least 6 characters.';
          msg.className = 'form-message error';
          return;
        }

        btn.disabled = true;
        btn.textContent = 'Creating account…';
        msg.textContent = '';
        msg.className = 'form-message';

        const { error } = await signUpWithPassword(email, password);

        if (error) {
          msg.textContent = error.message || 'Sign-up failed. Please try again.';
          msg.className = 'form-message error';
          btn.disabled = false;
          btn.textContent = 'Create Account';
        } else {
          msg.textContent = 'Account created! Check your email for a confirmation link, then sign in.';
          msg.className = 'form-message success';
          btn.disabled = false;
          btn.textContent = 'Create Account';
        }
      });
    }
  }, 0);

  return container;
}
