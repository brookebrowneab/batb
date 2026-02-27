import { signInWithMagicLink, signInWithPassword, signUpWithPassword } from '../adapters/auth.js';
import { validateLoginEmail } from '../domain/emailValidation.js';

export function renderFamilyLogin() {
  const container = document.createElement('div');
  container.className = 'page';
  container.innerHTML = `
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
  `;

  const mainForm = container.querySelector('#family-password-form');
  const loginHeading = container.querySelector('#family-login-heading');
  const loginIntro = container.querySelector('#family-login-intro');
  const altLinks = container.querySelector('.login-alt-links');
  const signupSection = container.querySelector('#family-signup-section');
  const magicSection = container.querySelector('#family-magic-section');

  function showMain() {
    loginHeading.hidden = false;
    loginIntro.hidden = false;
    mainForm.hidden = false;
    altLinks.hidden = false;
    signupSection.hidden = true;
    magicSection.hidden = true;
  }

  function showSignup() {
    loginHeading.hidden = true;
    loginIntro.hidden = true;
    mainForm.hidden = true;
    altLinks.hidden = true;
    signupSection.hidden = false;
    magicSection.hidden = true;
  }

  function showMagic() {
    loginHeading.hidden = true;
    loginIntro.hidden = true;
    mainForm.hidden = true;
    altLinks.hidden = true;
    signupSection.hidden = true;
    magicSection.hidden = false;
  }

  container.querySelector('#show-signup-toggle')?.addEventListener('click', showSignup);
  container.querySelector('#show-magic-toggle')?.addEventListener('click', showMagic);
  container.querySelector('#hide-signup-toggle')?.addEventListener('click', showMain);
  container.querySelector('#hide-magic-toggle')?.addEventListener('click', showMain);

  mainForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = container.querySelector('#family-pw-email').value.trim();
    const password = container.querySelector('#family-pw-password').value;
    const msg = container.querySelector('#family-pw-msg');
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

  const magicForm = container.querySelector('#family-magic-form');
  magicForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = container.querySelector('#family-magic-email').value.trim();
    const msg = container.querySelector('#family-magic-msg');
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

  const signupForm = container.querySelector('#family-signup-form');
  signupForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = container.querySelector('#family-signup-email').value.trim();
    const password = container.querySelector('#family-signup-password').value;
    const confirm = container.querySelector('#family-signup-confirm').value;
    const msg = container.querySelector('#family-signup-msg');
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

  return container;
}
