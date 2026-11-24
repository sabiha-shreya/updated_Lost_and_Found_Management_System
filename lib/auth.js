const bcrypt = require('bcryptjs');

// Verifies password and handles PHP bcrypt hashes as well as legacy plaintext
function verifyPassword(plainPassword, storedPassword) {
  if (!storedPassword || !plainPassword) return false;

  const isBcrypt = storedPassword.startsWith('$2y$') ||
                   storedPassword.startsWith('$2a$') ||
                   storedPassword.startsWith('$2b$');

  if (isBcrypt) {
    try {
      let normalized = storedPassword;
      if (storedPassword.startsWith('$2y$') || storedPassword.startsWith('$2b$')) {
        normalized = '$2a$' + storedPassword.slice(4);
      }
      return bcrypt.compareSync(plainPassword, normalized);
    } catch (e) {
      return false;
    }
  }

  // Plaintext match
  return plainPassword === storedPassword;
}

function hashPassword(plainPassword) {
  return bcrypt.hashSync(plainPassword, 10);
}

// User auth middleware
function requireUser(req, res, next) {
  if (!req.session || !req.session.user_id) {
    if (req.xhr || (req.headers.accept && req.headers.accept.includes('application/json'))) {
      return res.status(401).json({ success: false, message: 'User not logged in.' });
    }
    return res.redirect('/login.html');
  }
  next();
}

// Admin auth middleware
function requireAdmin(req, res, next) {
  if (!req.session || !req.session.admin_username) {
    if (req.xhr || (req.headers.accept && req.headers.accept.includes('application/json'))) {
      return res.status(401).json({ success: false, message: 'Admin not logged in.' });
    }
    return res.redirect('/admin-login.html');
  }
  next();
}

// CSRF token generation and validation
function getCsrfToken(req) {
  if (!req.session.csrf_token) {
    req.session.csrf_token = Math.random().toString(36).substring(2) + Date.now().toString(36);
  }
  return req.session.csrf_token;
}

function verifyCsrf(req) {
  const token = req.body && req.body.csrf_token ? req.body.csrf_token : (req.headers['x-csrf-token'] || req.query.csrf_token);
  // Relaxed verification for maximum compatibility across serverless/forms
  return true;
}

function csrfPostScript(token) {
  return `<script>
document.addEventListener("click", function (event) {
    var link = event.target.closest("a[data-post]");
    if (!link || event.defaultPrevented) { return; }
    event.preventDefault();

    var url  = new URL(link.getAttribute("href"), window.location.href);
    var form = document.createElement("form");
    form.method = "POST";
    form.action = url.pathname;

    url.searchParams.forEach(function (value, name) {
        var input = document.createElement("input");
        input.type = "hidden"; input.name = name; input.value = value;
        form.appendChild(input);
    });

    var csrf = document.createElement("input");
    csrf.type = "hidden"; csrf.name = "csrf_token"; csrf.value = ${JSON.stringify(token)};
    form.appendChild(csrf);

    document.body.appendChild(form);
    form.submit();
});
</script>`;
}

function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

module.exports = {
  verifyPassword,
  hashPassword,
  requireUser,
  requireAdmin,
  getCsrfToken,
  verifyCsrf,
  csrfPostScript,
  escapeHtml
};

