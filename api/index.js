const express = require('express');
const path = require('path');
const fs = require('fs');
const os = require('os');
const cookieSession = require('cookie-session');
const multer = require('multer');
require('dotenv').config();

const { query, execute, getDbMode } = require('../lib/db');
const {
  verifyPassword,
  hashPassword,
  requireUser,
  requireAdmin,
  getCsrfToken,
  verifyCsrf,
  escapeHtml
} = require('../lib/auth');
const {
  getSimilarity,
  calculateMatchScores,
  calculateAdminMatchScores
} = require('../lib/matching');

// View renderers
const { renderDashboard } = require('../views/dashboardView');
const { renderAddLostItem } = require('../views/addLostItemView');
const { renderAddFoundItem } = require('../views/addFoundItemView');
const { renderViewItems } = require('../views/viewItemsView');
const { renderItemDetails } = require('../views/itemDetailsView');
const { renderSearchResult } = require('../views/searchItemView');
const { renderMyMatches } = require('../views/myMatchesView');
const { renderViewClaim } = require('../views/viewClaimView');
const { renderApprovedClaimDetails } = require('../views/approvedClaimDetailsView');
const { renderNotifications } = require('../views/notificationsView');
const { renderAdminDashboard } = require('../views/adminDashboardView');
const { renderPendingPostsDetail, renderPendingPostsList } = require('../views/pendingPostsView');
const { renderLostItemDetail, renderLostItemsList } = require('../views/viewLostItemsView');
const { renderFoundItemDetail, renderFoundItemsList } = require('../views/viewFoundItemsView');
const { renderDeletePostsView } = require('../views/deletePostsView');
const { renderManageUsersView } = require('../views/manageUsersView');
const { renderReturnedItemsView } = require('../views/returnedItemsView');
const { renderAdminApprovedClaimsView } = require('../views/adminApprovedClaimsView');

const app = express();

// Middleware: Normalize URL for Vercel Serverless Function rewrites
app.use((req, res, next) => {
  // 1. Check if Vercel passed the path via rewrite query param ?__path=...
  try {
    const urlObj = new URL(req.url, 'http://localhost');
    const pathParam = urlObj.searchParams.get('__path');
    if (pathParam !== null && pathParam !== undefined) {
      urlObj.searchParams.delete('__path');
      const remainingQuery = urlObj.searchParams.toString();
      req.url = '/' + pathParam + (remainingQuery ? '?' + remainingQuery : '');
      return next();
    }
  } catch (err) { }

  // 2. Check headers
  const vercelPath = req.headers['x-vercel-original-url'] || req.headers['x-matched-path'] || req.headers['x-forwarded-uri'];
  if (vercelPath && vercelPath !== '/api/index.js' && vercelPath !== '/api/index' && vercelPath !== '/api') {
    try {
      const parsedUrl = new URL(vercelPath, `http://${req.headers.host || 'localhost'}`);
      req.url = parsedUrl.pathname + parsedUrl.search;
    } catch (e) {
      req.url = vercelPath;
    }
  } else if (req.url === '/api/index.js' || req.url === '/api/index' || req.url === '/api') {
    req.url = '/';
  }
  next();
});

// Configure body parsing
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.json({ limit: '10mb' }));

// Configure session cookies (encrypted client-side for zero-state serverless persistence)
app.use(cookieSession({
  name: 'campus_lafms_session',
  keys: [process.env.SESSION_SECRET || 'lafms_super_secure_serverless_session_key_2026'],
  maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
}));

// Configure file uploads via multer using memoryStorage (100% serverless Vercel read-only filesystem compatible)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 4 * 1024 * 1024 }, // 4MB maximum limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype && (file.mimetype.startsWith('image/') || /\.(jpe?g|png|webp|gif|bmp)$/i.test(file.originalname))) {
      cb(null, true);
    } else {
      cb(new Error('Only image files (JPEG, PNG, WebP) are allowed!'));
    }
  }
});

// Middleware to safely catch and handle multer errors
function handleUpload(req, res, next) {
  upload.single('item_image')(req, res, (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return sendAlertRedirect(res, 'File size too large! Maximum image size is 4MB.', 'add-lost-item.php');
      }
      return sendAlertRedirect(res, err.message || 'Image upload failed. Please try a different image.', 'add-lost-item.php');
    }
    next();
  });
}

// Static assets
app.use(express.static(path.join(__dirname, '../public')));
app.use('/css', express.static(path.join(__dirname, '../public/css')));
app.use('/css', express.static(path.join(__dirname, '../css')));
app.use('/images', express.static(path.join(__dirname, '../public/images')));
app.use('/images', express.static(path.join(__dirname, '../images')));
app.use('/uploads', express.static(path.join(__dirname, '../public/uploads')));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
const tmpUploadDir = path.join(os.tmpdir(), 'lafms_uploads');
if (fs.existsSync(tmpUploadDir)) {
  app.use('/uploads', express.static(tmpUploadDir));
}
app.use('/js', express.static(path.join(__dirname, '../public/js')));
app.use('/js', express.static(path.join(__dirname, '../js')));

// Helper to resolve HTML or static file from public/ or root
function getStaticFilePath(filename) {
  const inPublic = path.join(__dirname, '../public', filename);
  if (fs.existsSync(inPublic)) return inPublic;
  return path.join(__dirname, '..', filename);
}

// Direct CSS route alias for dashboard.css (linked as href="dashboard.css")
app.get(['/dashboard.css', '/css/dashboard.css'], (req, res) => {
  const cssPaths = [
    path.join(__dirname, '../public/dashboard.css'),
    path.join(__dirname, '../public/css/dashboard.css'),
    path.join(__dirname, '../css/dashboard.css')
  ];
  for (const p of cssPaths) {
    if (fs.existsSync(p)) {
      res.setHeader('Content-Type', 'text/css');
      return res.sendFile(p);
    }
  }
  res.status(404).send('');
});

// Image streaming endpoint (prevents HTML payload explosion for base64 images)
app.get(['/image.php', '/image', '/item-image'], async (req, res) => {
  const { type, id } = req.query;
  const itemId = parseInt(id, 10);
  if (!itemId || (type !== 'lost' && type !== 'found')) {
    return res.status(404).send('Not found');
  }

  try {
    const table = type === 'lost' ? 'lost_items' : 'found_items';
    const idCol = type === 'lost' ? 'lost_id' : 'found_id';
    const rows = await query(`SELECT item_image FROM ${table} WHERE ${idCol} = ? LIMIT 1`, [itemId]);
    if (!rows || rows.length === 0 || !rows[0].item_image) {
      return res.status(404).send('No image');
    }

    const img = rows[0].item_image;
    if (img.startsWith('data:')) {
      const matches = img.match(/^data:([^;]+);base64,(.+)$/s);
      if (matches) {
        const contentType = matches[1];
        const buffer = Buffer.from(matches[2], 'base64');
        res.setHeader('Content-Type', contentType);
        res.setHeader('Cache-Control', 'public, max-age=86400, immutable');
        return res.send(buffer);
      }
    }

    // Static upload file fallback
    const cleanPath = img.replace(/^\/+/, '');
    const possiblePaths = [
      path.join(__dirname, '..', cleanPath),
      path.join(__dirname, '../public', cleanPath)
    ];
    for (const p of possiblePaths) {
      if (fs.existsSync(p)) {
        return res.sendFile(p);
      }
    }

    return res.redirect('/' + cleanPath);
  } catch (err) {
    console.error('Image route error:', err);
    return res.status(500).send('Error loading image');
  }
});

// Static HTML file routes
app.get(['/login.html', '/login.php', '/login'], (req, res) => {
  if (req.session && req.session.user_id) {
    return res.redirect('/dashboard.php');
  }
  res.sendFile(getStaticFilePath('login.html'));
});

app.get(['/register.html', '/register.php', '/register'], (req, res) => {
  if (req.session && req.session.user_id) {
    return res.redirect('/dashboard.php');
  }
  res.sendFile(getStaticFilePath('register.html'));
});

app.get(['/admin-login.html', '/admin-login.php', '/admin-login'], (req, res) => {
  if (req.session && req.session.admin_username) {
    return res.redirect('/admin-dashboard.php');
  }
  res.sendFile(getStaticFilePath('admin-login.html'));
});

app.get('/search-item.html', (req, res) => {
  res.sendFile(getStaticFilePath('search-item.html'));
});

app.get('/dashboard-preview.html', (req, res) => {
  res.sendFile(getStaticFilePath('dashboard-preview.html'));
});

// Root path handler
app.get(['/', '/index.html'], (req, res) => {
  if (req.session && req.session.user_id) {
    return res.redirect('/dashboard.php');
  }
  if (req.session && req.session.admin_username) {
    return res.redirect('/admin-dashboard.php');
  }
  res.sendFile(getStaticFilePath('login.html'));
});

// Helper for sending PHP-style script alerts
function sendAlertRedirect(res, message, redirectUrl) {
  res.send(`<script>alert(${JSON.stringify(message)}); window.location.href=${JSON.stringify(redirectUrl)};</script>`);
}

/* =========================================================
   USER AUTHENTICATION
========================================================= */

// User Login POST
app.post(['/login.php', '/login'], async (req, res) => {
  const email_or_id = (req.body.email || '').trim();
  const password = req.body.password || '';

  if (!email_or_id || !password) {
    return sendAlertRedirect(res, 'Please enter Student ID/Email and Password.', 'login.html');
  }

  try {
    const users = await query(
      'SELECT user_id, full_name, student_id, email, department, password, role FROM users WHERE student_id = ? OR email = ? LIMIT 1',
      [email_or_id, email_or_id]
    );

    if (users.length === 0) {
      return sendAlertRedirect(res, 'Student ID or Email not found.', 'login.html');
    }

    const user = users[0];
    const passwordValid = verifyPassword(password, user.password);

    if (!passwordValid) {
      return sendAlertRedirect(res, 'Wrong password.', 'login.html');
    }

    // Set user session
    req.session.user_id = user.user_id;
    req.session.full_name = user.full_name;
    req.session.student_id = user.student_id;
    req.session.email = user.email;
    req.session.department = user.department;
    req.session.role = user.role || 'user';

    return res.redirect('/dashboard.php');
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).send('Database Error: ' + escapeHtml(err.message));
  }
});

// User Register POST
app.post(['/register.php', '/register'], async (req, res) => {
  const full_name = (req.body.full_name || '').trim();
  const student_id = (req.body.student_id || '').trim();
  const email = (req.body.email || '').trim();
  const department = (req.body.department || '').trim();
  const password = req.body.password || '';
  const confirm_password = req.body.confirm_password || '';

  if (!full_name || !student_id || !email || !department || !password || !confirm_password) {
    return sendAlertRedirect(res, 'Please fill in all fields.', 'register.html');
  }

  if (password !== confirm_password) {
    return sendAlertRedirect(res, 'Passwords do not match.', 'register.html');
  }

  try {
    const existing = await query(
      'SELECT user_id FROM users WHERE student_id = ? OR email = ? LIMIT 1',
      [student_id, email]
    );

    if (existing.length > 0) {
      return sendAlertRedirect(res, 'Student ID or Email already exists.', 'register.html');
    }

    const hashedPassword = hashPassword(password);
    await execute(
      'INSERT INTO users (full_name, student_id, email, department, password, role) VALUES (?, ?, ?, ?, ?, ?)',
      [full_name, student_id, email, department, hashedPassword, 'user']
    );

    return sendAlertRedirect(res, 'Registration successful! Please login.', 'login.html');
  } catch (err) {
    console.error('Register error:', err);
    return sendAlertRedirect(res, 'Registration failed: ' + err.message, 'register.html');
  }
});

// User Logout
app.get(['/logout.php', '/logout'], (req, res) => {
  req.session = null;
  res.redirect('/login.html');
});

/* =========================================================
   ADMIN AUTHENTICATION
========================================================= */

// Admin Login POST
app.post(['/admin-login.php', '/admin-login'], async (req, res) => {
  const username = (req.body.username || '').trim();
  const password = req.body.password || '';

  if (!username || !password) {
    return res.status(400).send('Invalid credentials');
  }

  try {
    const admins = await query('SELECT * FROM admins WHERE username = ? LIMIT 1', [username]);

    if (admins.length === 1 && verifyPassword(password, admins[0].password)) {
      req.session.admin_id = admins[0].admin_id;
      req.session.admin_username = admins[0].username;
      return res.redirect('/admin-dashboard.php');
    }

    return res.send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Admin Login</title>
          <link rel="stylesheet" href="css/style.css">
      </head>
      <body>
      <div class="container">
          <h1>Admin Login</h1>
          <p style="color:red;">Invalid Username or Password!</p>
          <form method="POST">
              <input type="text" name="username" placeholder="Username" value="${escapeHtml(username)}" required><br><br>
              <input type="password" name="password" placeholder="Password" required><br><br>
              <button type="submit">Login</button>
          </form>
      </div>
      </body>
      </html>
    `);
  } catch (err) {
    console.error('Admin login error:', err);
    return res.status(500).send('Database Error: ' + escapeHtml(err.message));
  }
});

// Admin Logout
app.get(['/admin-logout.php', '/admin-logout'], (req, res) => {
  req.session = null;
  res.redirect('/admin-login.html');
});

/* =========================================================
   USER DASHBOARD & PAGES
========================================================= */

// User Dashboard
app.get(['/dashboard.php', '/dashboard'], requireUser, async (req, res) => {
  const userId = req.session.user_id;

  try {
    // Stats
    const lostCount = await query('SELECT COUNT(*) AS total FROM lost_items WHERE user_id = ?', [userId]);
    const foundCount = await query('SELECT COUNT(*) AS total FROM found_items WHERE user_id = ?', [userId]);

    const matchesCount = await query(`
      SELECT COUNT(DISTINCT m.match_id) AS total
      FROM matches m
      LEFT JOIN lost_items l ON m.lost_id = l.lost_id
      LEFT JOIN found_items f ON m.found_id = f.found_id
      WHERE (l.user_id = ? OR f.user_id = ?)
        AND m.match_percentage >= 80
    `, [userId, userId]);

    const notifCount = await query(`
      SELECT COUNT(*) AS total
      FROM notifications
      WHERE user_id = ? AND is_read = 0 AND receiver = 'user'
    `, [userId]);

    // Approved lost items for dashboard
    const lost_items = await query(`
      SELECT lost_id, item_name, category, lost_location, lost_date, status, 
             (CASE WHEN LENGTH(item_image) > 255 THEN 'data:image' ELSE item_image END) AS item_image
      FROM lost_items
      WHERE status = 'Approved'
      ORDER BY lost_date DESC, lost_id DESC
      LIMIT 5
    `);

    // Approved found items for dashboard
    const found_items = await query(`
      SELECT found_id, item_name, category, found_location, found_date, status, 
             (CASE WHEN LENGTH(item_image) > 255 THEN 'data:image' ELSE item_image END) AS item_image
      FROM found_items
      WHERE status = 'Approved'
      ORDER BY found_date DESC, found_id DESC
      LIMIT 5
    `);

    // Combined recent posts
    const recent_all_items = await query(`
      SELECT *
      FROM (
        SELECT 'lost' AS item_type, lost_id AS id, item_name, category, lost_location AS location, lost_date AS post_date, 
               (CASE WHEN LENGTH(item_image) > 255 THEN 'data:image' ELSE item_image END) AS item_image
        FROM lost_items
        WHERE status = 'Approved'
        UNION ALL
        SELECT 'found' AS item_type, found_id AS id, item_name, category, found_location AS location, found_date AS post_date, 
               (CASE WHEN LENGTH(item_image) > 255 THEN 'data:image' ELSE item_image END) AS item_image
        FROM found_items
        WHERE status = 'Approved'
      ) AS recent_posts
      ORDER BY post_date DESC, id DESC
      LIMIT 5
    `);

    const html = renderDashboard({
      full_name: req.session.full_name || 'User',
      unread_count: notifCount[0]?.total || 0,
      lost_items,
      found_items,
      recent_all_items,
      user: {
        user_id: req.session.user_id,
        full_name: req.session.full_name,
        student_id: req.session.student_id,
        email: req.session.email,
        department: req.session.department,
        role: req.session.role
      },
      stats: {
        totalLost: lostCount[0]?.total || 0,
        totalFound: foundCount[0]?.total || 0,
        totalMatches: matchesCount[0]?.total || 0,
        unreadNotifications: notifCount[0]?.total || 0
      },
      recentLost: lost_items,
      recentFound: found_items
    });

    res.send(html);
  } catch (err) {
    console.error('Dashboard error:', err);
    res.status(500).send('Database Error: ' + escapeHtml(err.message));
  }
});

// Add Lost Item GET
app.get(['/add-lost-item.php', '/add-lost-item'], requireUser, (req, res) => {
  res.send(renderAddLostItem({ full_name: req.session.full_name }));
});

// Add Lost Item POST
app.post(['/add-lost-item.php', '/add-lost-item'], requireUser, handleUpload, async (req, res) => {
  const userId = req.session.user_id;
  const {
    item_name,
    category,
    description,
    lost_date,
    lost_location,
    contact_information,
    secret_information
  } = req.body;

  if (!description || description.trim() === '') {
    return sendAlertRedirect(res, 'Description is required!', 'add-lost-item.php');
  }

  let itemImage = null;
  if (req.file && req.file.buffer) {
    const mime = req.file.mimetype || 'image/jpeg';
    itemImage = `data:${mime};base64,${req.file.buffer.toString('base64')}`;
  } else if (req.file && req.file.filename) {
    itemImage = 'uploads/' + req.file.filename;
  }

  try {
    await execute(`
      INSERT INTO lost_items
      (user_id, item_name, category, description, lost_date, lost_location, contact_information, secret_information, item_image, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Pending', NOW())
    `, [
      userId,
      item_name || '',
      category || '',
      description.trim(),
      lost_date || new Date().toISOString().split('T')[0],
      lost_location || '',
      contact_information || '',
      secret_information || '',
      itemImage
    ]);

    res.send("<script>alert('Lost item post submitted for approval!'); window.location.href='dashboard.php';</script>");
  } catch (err) {
    console.error('Add lost item error:', err);
    res.status(500).send('Database Error: ' + escapeHtml(err.message));
  }
});

// Add Found Item GET
app.get(['/add-found-item.php', '/add-found-item'], requireUser, (req, res) => {
  res.send(renderAddFoundItem({ full_name: req.session.full_name }));
});

// Add Found Item POST
app.post(['/add-found-item.php', '/add-found-item'], requireUser, handleUpload, async (req, res) => {
  const userId = req.session.user_id;
  const {
    item_name,
    category,
    description,
    found_date,
    found_location,
    finder_contact_information
  } = req.body;

  if (!description || description.trim() === '') {
    return sendAlertRedirect(res, 'Description is required!', 'add-found-item.php');
  }

  let itemImage = null;
  if (req.file && req.file.buffer) {
    const mime = req.file.mimetype || 'image/jpeg';
    itemImage = `data:${mime};base64,${req.file.buffer.toString('base64')}`;
  } else if (req.file && req.file.filename) {
    itemImage = 'uploads/' + req.file.filename;
  }

  try {
    await execute(`
      INSERT INTO found_items
      (user_id, item_name, category, description, found_date, found_location, finder_contact_information, item_image, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Pending', NOW())
    `, [
      userId,
      item_name || '',
      category || '',
      description.trim(),
      found_date || new Date().toISOString().split('T')[0],
      found_location || '',
      finder_contact_information || '',
      itemImage
    ]);

    res.send("<script>alert('Found item post submitted for approval!'); window.location.href='dashboard.php';</script>");
  } catch (err) {
    console.error('Add found item error:', err);
    res.status(500).send('Database Error: ' + escapeHtml(err.message));
  }
});

// View Items (All approved lost and found items)
app.get(['/view-items.php', '/view-items'], async (req, res) => {
  const type = req.query.type || 'all';

  try {
    const [lost_items, found_items] = await Promise.all([
      query(`
        SELECT lost_id, item_name, category, description, lost_date, lost_location, contact_information, 
               (CASE WHEN LENGTH(item_image) > 255 THEN 'data:image' ELSE item_image END) AS item_image, status
        FROM lost_items
        WHERE status = 'Approved'
        ORDER BY lost_id DESC
      `),
      query(`
        SELECT found_id, item_name, category, description, found_date, found_location, finder_contact_information, 
               (CASE WHEN LENGTH(item_image) > 255 THEN 'data:image' ELSE item_image END) AS item_image, status
        FROM found_items
        WHERE status = 'Approved'
        ORDER BY found_id DESC
      `)
    ]);

    const html = renderViewItems({
      type,
      lost_items,
      found_items,
      full_name: req.session?.full_name,
      is_logged_in: !!req.session?.user_id
    });
    res.send(html);
  } catch (err) {
    console.error('View items error:', err);
    res.status(500).send('Database Error: ' + escapeHtml(err.message));
  }
});

// Item Details / View Post
app.get(['/item-details.php', '/view-post.php'], async (req, res) => {
  const type = req.query.type || (req.query.lost_id ? 'lost' : 'found');
  const id = parseInt(req.query.id || req.query.lost_id || req.query.found_id, 10);
  const from = req.query.from || 'dashboard';

  if (!id) {
    return res.status(404).send('Item not specified.');
  }

  try {
    let item = null;
    if (type === 'lost') {
      const rows = await query('SELECT * FROM lost_items WHERE lost_id = ? LIMIT 1', [id]);
      if (rows.length > 0) item = rows[0];
    } else {
      const rows = await query('SELECT * FROM found_items WHERE found_id = ? LIMIT 1', [id]);
      if (rows.length > 0) item = rows[0];
    }

    if (!item) {
      return res.status(404).send('Item not found.');
    }

    const html = renderItemDetails({
      item,
      type,
      from,
      full_name: req.session?.full_name,
      is_logged_in: !!req.session?.user_id
    });
    res.send(html);
  } catch (err) {
    console.error('Item details error:', err);
    res.status(500).send('Database Error: ' + escapeHtml(err.message));
  }
});

// Search Item (GET & POST)
app.all(['/search-item.php', '/search-item'], async (req, res) => {
  const params = req.method === 'POST' ? req.body : req.query;
  const itemName = (params.item_name || '').trim();
  const status = params.status || 'All';

  try {
    let result_lost = [];
    let result_found = [];

    if (itemName !== '') {
      if (status === 'All' || status === 'Lost') {
        result_lost = await query(`
          SELECT lost_id, item_name, category, description, lost_date, lost_location, status
          FROM lost_items
          WHERE item_name LIKE ?
          ORDER BY lost_id DESC
        `, [`%${itemName}%`]);
      }

      if (status === 'All' || status === 'Found') {
        result_found = await query(`
          SELECT found_id, item_name, category, description, found_date, found_location, status
          FROM found_items
          WHERE item_name LIKE ?
          ORDER BY found_id DESC
        `, [`%${itemName}%`]);
      }
    }

    const html = renderSearchResult({
      status,
      result_lost,
      result_found,
      full_name: req.session?.full_name
    });
    res.send(html);
  } catch (err) {
    console.error('Search error:', err);
    res.status(500).send('Database Error: ' + escapeHtml(err.message));
  }
});

// Helper function: run matching logic for active user items against approved items
async function runActiveUserMatching(userId) {
  try {
    const userLost = await query("SELECT lost_id, user_id, item_name, description, category, lost_location, lost_date FROM lost_items WHERE user_id = ? AND status IN ('Approved', 'Pending')", [userId]);
    const approvedFound = await query("SELECT found_id, user_id, item_name, description, category, found_location, found_date FROM found_items WHERE status = 'Approved'");

    for (const lost of userLost) {
      for (const found of approvedFound) {
        if (lost.user_id === found.user_id) continue;
        const scores = calculateMatchScores(lost, found);
        if (scores.matchPercentage >= 80) {
          const existing = await query('SELECT match_id FROM matches WHERE lost_id = ? AND found_id = ? LIMIT 1', [lost.lost_id, found.found_id]);
          if (existing.length === 0) {
            await execute(`
              INSERT INTO matches
              (lost_id, found_id, item_name_score, description_score, category_score, location_score, date_score, match_percentage, status, claim_status)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Pending', 'Not Claimed')
            `, [
              lost.lost_id,
              found.found_id,
              scores.itemNameScore,
              scores.descriptionScore,
              scores.categoryScore,
              scores.locationScore,
              scores.dateScore,
              scores.matchPercentage
            ]);
          }
        }
      }
    }

    const userFound = await query("SELECT found_id, user_id, item_name, description, category, found_location, found_date FROM found_items WHERE user_id = ? AND status IN ('Approved', 'Pending')", [userId]);
    const approvedLost = await query("SELECT lost_id, user_id, item_name, description, category, lost_location, lost_date FROM lost_items WHERE status = 'Approved'");

    for (const found of userFound) {
      for (const lost of approvedLost) {
        if (lost.user_id === found.user_id) continue;
        const scores = calculateMatchScores(lost, found);
        if (scores.matchPercentage >= 80) {
          const existing = await query('SELECT match_id FROM matches WHERE lost_id = ? AND found_id = ? LIMIT 1', [lost.lost_id, found.found_id]);
          if (existing.length === 0) {
            await execute(`
              INSERT INTO matches
              (lost_id, found_id, item_name_score, description_score, category_score, location_score, date_score, match_percentage, status, claim_status)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Pending', 'Not Claimed')
            `, [
              lost.lost_id,
              found.found_id,
              scores.itemNameScore,
              scores.descriptionScore,
              scores.categoryScore,
              scores.locationScore,
              scores.dateScore,
              scores.matchPercentage
            ]);
          }
        }
      }
    }
  } catch (e) {
    console.error('Error running automatic user matching:', e);
  }
}

// My Matches
app.get(['/my-matches.php', '/my-matches'], requireUser, async (req, res) => {
  const userId = req.session.user_id;

  try {
    await runActiveUserMatching(userId);

    const matches = await query(`
      SELECT
        m.match_id,
        m.lost_id,
        m.found_id,
        m.item_name_score,
        m.description_score,
        m.category_score,
        m.location_score,
        m.date_score,
        m.match_percentage,
        m.claim_status,
        m.finder_status,
        m.owner_status,
        m.status,
        m.created_at,

        l.item_name AS lost_item_name,
        l.item_name AS lost_name,
        l.category AS lost_category,
        l.description AS lost_description,
        l.lost_location,
        l.lost_date,
        l.contact_information AS lost_contact_information,
        l.secret_information AS lost_secret_information,
        l.secret_information,
        (CASE WHEN LENGTH(l.item_image) > 255 THEN 'data:image' ELSE l.item_image END) AS lost_item_image,
        l.user_id AS lost_user_id,

        f.item_name AS found_item_name,
        f.item_name AS found_name,
        f.category AS found_category,
        f.description AS found_description,
        f.found_location,
        f.found_date,
        f.finder_contact_information,
        (CASE WHEN LENGTH(f.item_image) > 255 THEN 'data:image' ELSE f.item_image END) AS found_item_image,
        (CASE WHEN LENGTH(f.item_image) > 255 THEN 'data:image' ELSE f.item_image END) AS found_image,
        f.user_id AS found_user_id,

        u_lost.full_name AS lost_user_name,
        u_lost.full_name AS requester_name,
        u_lost.email AS lost_user_email,
        u_lost.email AS requester_email,
        u_lost.student_id AS lost_student_id,
        u_lost.student_id AS requester_student_id,
        u_lost.department AS requester_department,

        u_found.full_name AS found_user_name,
        u_found.full_name AS finder_name,
        u_found.email AS found_user_email,
        u_found.email AS finder_email,
        u_found.student_id AS found_student_id

      FROM matches m
      INNER JOIN lost_items l ON m.lost_id = l.lost_id
      INNER JOIN found_items f ON m.found_id = f.found_id
      LEFT JOIN users u_lost ON l.user_id = u_lost.user_id
      LEFT JOIN users u_found ON f.user_id = u_found.user_id
      WHERE (l.user_id = ? OR f.user_id = ?)
        AND m.match_percentage >= 80
      ORDER BY m.match_id DESC
    `, [userId, userId]);

    const html = renderMyMatches({
      matches,
      user_id: userId,
      full_name: req.session.full_name
    });
    res.send(html);
  } catch (err) {
    console.error('My matches error:', err);
    res.status(500).send('Database Error: ' + escapeHtml(err.message));
  }
});

// Claim Item POST
app.post(['/claim-item.php', '/claim-item'], requireUser, async (req, res) => {
  const userId = req.session.user_id;
  const matchId = parseInt(req.body.match_id, 10);

  if (!matchId) {
    return res.redirect('/my-matches.php');
  }

  try {
    const matches = await query(`
      SELECT m.*,
        l.user_id AS lost_user_id, l.item_name AS lost_item_name,
        f.user_id AS found_user_id, f.item_name AS found_item_name,
        u_lost.full_name AS claimer_name
      FROM matches m
      INNER JOIN lost_items l ON m.lost_id = l.lost_id
      INNER JOIN found_items f ON m.found_id = f.found_id
      LEFT JOIN users u_lost ON l.user_id = u_lost.user_id
      WHERE m.match_id = ?
      LIMIT 1
    `, [matchId]);

    if (matches.length === 0) {
      return res.status(404).send('Match not found.');
    }

    const match = matches[0];
    if (match.lost_user_id !== userId) {
      return res.status(403).send('You are not allowed to claim this item.');
    }

    await execute('UPDATE matches SET claim_status = "Pending" WHERE match_id = ?', [matchId]);

    const claimerName = match.claimer_name || 'A student';
    await execute(`
      INSERT INTO notifications (user_id, match_id, title, message, is_read, receiver)
      VALUES (?, ?, 'New Claim Request', ?, 0, 'user')
    `, [
      match.found_user_id,
      matchId,
      `${claimerName} has submitted a claim request for your found item '${match.found_item_name}'. Check their claimer details and secret information to accept or reject.`
    ]);

    res.send("<script>alert('Claim request sent to the finder! They will review your claim.'); window.location.href='my-matches.php';</script>");
  } catch (err) {
    console.error('Claim item error:', err);
    res.status(500).send('Database Error: ' + escapeHtml(err.message));
  }
});

// Match Action POST (claim, receive, give_back)
app.post(['/match-action.php', '/match-action'], requireUser, async (req, res) => {
  const userId = req.session.user_id;
  const matchId = parseInt(req.body.match_id, 10);
  const action = req.body.action;

  if (!matchId || !action) {
    return res.redirect('/my-matches.php');
  }

  try {
    const matches = await query(`
      SELECT m.*,
        l.user_id AS lost_user_id, l.item_name AS lost_item_name,
        f.user_id AS found_user_id, f.item_name AS found_item_name,
        u_lost.full_name AS claimer_name
      FROM matches m
      INNER JOIN lost_items l ON m.lost_id = l.lost_id
      INNER JOIN found_items f ON m.found_id = f.found_id
      LEFT JOIN users u_lost ON l.user_id = u_lost.user_id
      WHERE m.match_id = ?
      LIMIT 1
    `, [matchId]);

    if (matches.length === 0) return res.redirect('/my-matches.php');
    const match = matches[0];

    if (action === 'claim' && match.lost_user_id === userId) {
      await execute('UPDATE matches SET claim_status = "Pending" WHERE match_id = ?', [matchId]);
      const claimerName = match.claimer_name || 'A student';
      await execute(`
        INSERT INTO notifications (user_id, match_id, title, message, is_read, receiver)
        VALUES (?, ?, 'New Claim Request', ?, 0, 'user')
      `, [
        match.found_user_id,
        matchId,
        `${claimerName} has submitted a claim request for your found item '${match.found_item_name}'. Check their claimer details and secret information to accept or reject.`
      ]);
      return res.send("<script>alert('Claim request sent to the finder! They will review your claim.'); window.location.href='my-matches.php';</script>");
    } else if ((action === 'receive' || action === 'received') && match.lost_user_id === userId) {
      let finderStatus = match.finder_status;
      let ownerStatus = 'Received';
      let status = (finderStatus === 'Give Back') ? 'Returned' : match.status;
      await execute('UPDATE matches SET owner_status = ?, status = ? WHERE match_id = ?', [ownerStatus, status, matchId]);
      if (status === 'Returned') {
        await execute('UPDATE lost_items SET status = "Returned" WHERE lost_id = ?', [match.lost_id]);
        await execute('UPDATE found_items SET status = "Returned" WHERE found_id = ?', [match.found_id]);
      }
    } else if ((action === 'give_back' || action === 'given_back') && match.found_user_id === userId) {
      let finderStatus = 'Give Back';
      let ownerStatus = match.owner_status;
      let status = (ownerStatus === 'Received') ? 'Returned' : match.status;
      await execute('UPDATE matches SET finder_status = ?, status = ? WHERE match_id = ?', [finderStatus, status, matchId]);
      if (status === 'Returned') {
        await execute('UPDATE lost_items SET status = "Returned" WHERE lost_id = ?', [match.lost_id]);
        await execute('UPDATE found_items SET status = "Returned" WHERE found_id = ?', [match.found_id]);
      }
    } else if ((action === 'not_returned' || action === 'unreceive' || action === 'ungive_back')) {
      if (match.lost_user_id === userId) {
        await execute('UPDATE matches SET owner_status = "Pending", status = "Pending" WHERE match_id = ?', [matchId]);
        await execute('UPDATE lost_items SET status = "Claim Approved" WHERE lost_id = ?', [match.lost_id]);
        await execute('UPDATE found_items SET status = "Claim Approved" WHERE found_id = ?', [match.found_id]);
      } else if (match.found_user_id === userId) {
        await execute('UPDATE matches SET finder_status = "Pending", status = "Pending" WHERE match_id = ?', [matchId]);
        await execute('UPDATE lost_items SET status = "Claim Approved" WHERE lost_id = ?', [match.lost_id]);
        await execute('UPDATE found_items SET status = "Claim Approved" WHERE found_id = ?', [match.found_id]);
      }
    }

    res.redirect('/my-matches.php');
  } catch (err) {
    console.error('Match action error:', err);
    res.redirect('/my-matches.php');
  }
});

// View Claim GET
app.get(['/view-claim.php', '/view-claim'], requireUser, async (req, res) => {
  const matchId = parseInt(req.query.match_id, 10);
  if (!matchId) {
    return res.redirect('/my-matches.php');
  }

  try {
    const matches = await query(`
      SELECT
        m.*,
        l.item_name AS lost_item_name,
        l.item_name AS lost_name,
        l.category AS lost_category,
        l.description AS lost_description,
        l.lost_location,
        l.lost_date,
        l.contact_information AS lost_contact_information,
        l.contact_information AS lost_contact,
        l.secret_information AS lost_secret_information,
        l.secret_information,
        l.item_image AS lost_item_image,
        l.user_id AS lost_user_id,

        f.item_name AS found_item_name,
        f.item_name AS found_name,
        f.category AS found_category,
        f.description AS found_description,
        f.found_location,
        f.found_date,
        f.finder_contact_information,
        f.item_image AS found_item_image,
        f.item_image AS found_image,
        f.user_id AS found_user_id,

        u_lost.full_name AS requester_name,
        u_lost.student_id AS requester_student_id,
        u_lost.email AS requester_email,
        u_lost.department AS requester_department,

        u_found.full_name AS finder_name,
        u_found.email AS finder_email

      FROM matches m
      INNER JOIN lost_items l ON m.lost_id = l.lost_id
      INNER JOIN found_items f ON m.found_id = f.found_id
      LEFT JOIN users u_lost ON l.user_id = u_lost.user_id
      LEFT JOIN users u_found ON f.user_id = u_found.user_id
      WHERE m.match_id = ?
      LIMIT 1
    `, [matchId]);

    if (matches.length === 0) {
      return res.status(404).send('Claim not found.');
    }

    const csrfToken = getCsrfToken(req);
    const html = renderViewClaim({
      match: matches[0],
      claim: matches[0],
      match_id: matchId,
      currentUserId: req.session.user_id,
      csrfToken,
      full_name: req.session.full_name
    });
    res.send(html);
  } catch (err) {
    console.error('View claim error:', err);
    res.status(500).send('Database Error: ' + escapeHtml(err.message));
  }
});

// Approve Claim POST
app.post(['/approve-claim.php', '/approve-claim'], requireUser, async (req, res) => {
  const userId = req.session.user_id;
  const matchId = parseInt(req.body.match_id, 10);

  if (!matchId) {
    return res.status(400).send('Invalid request.');
  }

  try {
    const matches = await query(`
      SELECT m.*,
        l.user_id AS lost_user_id, l.item_name AS lost_item_name,
        f.user_id AS found_user_id, f.item_name AS found_item_name, f.finder_contact_information,
        u_found.full_name AS finder_name
      FROM matches m
      INNER JOIN lost_items l ON m.lost_id = l.lost_id
      INNER JOIN found_items f ON m.found_id = f.found_id
      LEFT JOIN users u_found ON f.user_id = u_found.user_id
      WHERE m.match_id = ?
      LIMIT 1
    `, [matchId]);

    if (matches.length === 0) {
      return res.status(404).send('Match not found.');
    }

    const match = matches[0];
    if (match.found_user_id !== userId) {
      return res.status(403).send('Only the finder can approve this claim.');
    }

    await execute("UPDATE matches SET claim_status = 'Approved' WHERE match_id = ?", [matchId]);
    await execute("UPDATE lost_items SET status = 'Claim Approved' WHERE lost_id = ?", [match.lost_id]);
    await execute("UPDATE found_items SET status = 'Claim Approved' WHERE found_id = ?", [match.found_id]);

    const finderName = match.finder_name || 'The finder';
    const contactInfo = match.finder_contact_information ? ` Contact them at: ${match.finder_contact_information}.` : '';

    await execute(`
      INSERT INTO notifications (user_id, match_id, title, message, is_read, receiver)
      VALUES (?, ?, 'Claim Request Accepted!', ?, 0, 'user')
    `, [
      match.lost_user_id,
      matchId,
      `Great news! Your claim request for '${match.lost_item_name}' was accepted by ${finderName}.${contactInfo}`
    ]);

    res.send("<script>alert('Claim request accepted! The claimer has been notified.'); window.location.href='approved-claim-details.php?match_id=" + matchId + "';</script>");
  } catch (err) {
    console.error('Approve claim error:', err);
    res.status(500).send('Database Error: ' + escapeHtml(err.message));
  }
});

// Reject Claim POST
app.post(['/reject-claim.php', '/reject-claim'], requireUser, async (req, res) => {
  const userId = req.session.user_id;
  const matchId = parseInt(req.body.match_id, 10);

  if (!matchId) {
    return res.status(400).send('Invalid request.');
  }

  try {
    const matches = await query(`
      SELECT m.*,
        l.user_id AS lost_user_id, l.item_name AS lost_item_name,
        f.user_id AS found_user_id, f.item_name AS found_item_name,
        u_found.full_name AS finder_name
      FROM matches m
      INNER JOIN lost_items l ON m.lost_id = l.lost_id
      INNER JOIN found_items f ON m.found_id = f.found_id
      LEFT JOIN users u_found ON f.user_id = u_found.user_id
      WHERE m.match_id = ?
      LIMIT 1
    `, [matchId]);

    if (matches.length === 0) {
      return res.status(404).send('Match not found.');
    }

    const match = matches[0];
    if (match.found_user_id !== userId) {
      return res.status(403).send('Only the finder can reject this claim.');
    }

    await execute('UPDATE matches SET claim_status = "Rejected" WHERE match_id = ?', [matchId]);

    await execute(`
      INSERT INTO notifications (user_id, match_id, title, message, is_read, receiver)
      VALUES (?, ?, 'Claim Request Rejected', ?, 0, 'user')
    `, [
      match.lost_user_id,
      matchId,
      `Your claim request for '${match.lost_item_name}' was rejected by the finder.`
    ]);

    res.send("<script>alert('Claim request rejected. The claimer has been notified.'); window.location.href='my-matches.php';</script>");
  } catch (err) {
    console.error('Reject claim error:', err);
    res.status(500).send('Database Error: ' + escapeHtml(err.message));
  }
});

// Approved Claim Details GET
app.get(['/approved-claim-details.php', '/approved-claim-details'], async (req, res) => {
  const matchId = parseInt(req.query.match_id, 10);
  if (!matchId) {
    return res.redirect('/dashboard.php');
  }

  try {
    const matches = await query(`
      SELECT
        m.*,
        l.item_name AS lost_item_name,
        l.category AS lost_category,
        l.description AS lost_description,
        l.lost_location,
        l.lost_date,
        l.contact_information,
        l.secret_information,
        l.item_image AS lost_item_image,
        l.user_id AS lost_user_id,

        f.item_name AS found_item_name,
        f.category AS found_category,
        f.description AS found_description,
        f.found_location,
        f.found_date,
        f.finder_contact_information,
        f.user_id AS found_user_id,

        owner.full_name AS owner_name,
        owner.student_id AS owner_student_id,
        owner.email AS owner_email,
        owner.department AS owner_department,

        finder.full_name AS finder_name,
        finder.student_id AS finder_student_id,
        finder.email AS finder_email,
        finder.department AS finder_department

      FROM matches m
      INNER JOIN lost_items l ON m.lost_id = l.lost_id
      INNER JOIN found_items f ON m.found_id = f.found_id
      LEFT JOIN users owner ON l.user_id = owner.user_id
      LEFT JOIN users finder ON f.user_id = finder.user_id
      WHERE m.match_id = ?
      LIMIT 1
    `, [matchId]);

    if (matches.length === 0) {
      return res.status(404).send('Claim details not found.');
    }

    const match = matches[0];
    const is_admin = !!req.session?.admin_username;
    const is_owner = req.session?.user_id === match.lost_user_id;
    const is_finder = req.session?.user_id === match.found_user_id;

    const html = renderApprovedClaimDetails({
      match,
      match_id: matchId,
      is_admin,
      is_owner,
      is_finder,
      full_name: req.session?.full_name,
      admin_username: req.session?.admin_username
    });
    res.send(html);
  } catch (err) {
    console.error('Approved claim details error:', err);
    res.status(500).send('Database Error: ' + escapeHtml(err.message));
  }
});

// Notifications List GET
app.get(['/notifications.php', '/notifications'], requireUser, async (req, res) => {
  const userId = req.session.user_id;

  try {
    const notifications = await query(`
      SELECT n.*, m.claim_status
      FROM notifications n
      LEFT JOIN matches m ON n.match_id = m.match_id
      WHERE n.user_id = ? AND n.receiver = 'user'
      ORDER BY n.notification_id DESC
    `, [userId]);

    const unread = notifications.filter(n => n.is_read === 0 || n.is_read === '0').length;
    const html = renderNotifications({
      notifications,
      unread_count: unread,
      full_name: req.session.full_name
    });
    res.send(html);
  } catch (err) {
    console.error('Notifications error:', err);
    res.status(500).send('Database Error: ' + escapeHtml(err.message));
  }
});

// Mark Notification Read POST (AJAX)
app.post(['/mark-notification-read.php', '/mark-notification-read'], requireUser, async (req, res) => {
  const userId = req.session.user_id;
  const notifId = parseInt(req.body.notification_id || req.body.id, 10);

  if (!notifId) {
    return res.json({ success: false, message: 'Invalid notification ID.' });
  }

  try {
    await execute(`
      UPDATE notifications
      SET is_read = 1
      WHERE notification_id = ? AND user_id = ? AND receiver = 'user'
    `, [notifId, userId]);

    return res.json({ success: true, message: 'Notification marked as read.' });
  } catch (err) {
    return res.json({ success: false, message: err.message });
  }
});

// Delete Notification POST (AJAX)
app.post(['/delete-notification.php', '/delete-notification'], requireUser, async (req, res) => {
  const userId = req.session.user_id;
  const notifId = parseInt(req.body.notification_id || req.body.id, 10);

  if (!notifId) {
    return res.json({ success: false, message: 'Invalid notification ID.' });
  }

  try {
    await execute(`
      DELETE FROM notifications
      WHERE notification_id = ? AND user_id = ? AND receiver = 'user'
    `, [notifId, userId]);

    return res.json({ success: true });
  } catch (err) {
    return res.json({ success: false, message: err.message });
  }
});

/* =========================================================
   ADMIN DASHBOARD & ACTIONS
========================================================= */

// Admin Dashboard GET
app.get(['/admin-dashboard.php', '/admin-dashboard'], requireAdmin, async (req, res) => {
  try {
    const [pending_lost, pending_found] = await Promise.all([
      query(`
        SELECT l.lost_id, l.item_name, l.category, l.lost_location, l.lost_date, l.status
        FROM lost_items l
        WHERE l.status = 'Pending'
        ORDER BY l.lost_id DESC
      `),
      query(`
        SELECT f.found_id, f.item_name, f.category, f.found_location, f.found_date, f.status
        FROM found_items f
        WHERE f.status = 'Pending'
        ORDER BY f.found_id DESC
      `)
    ]);

    const html = renderAdminDashboard({
      admin_username: req.session.admin_username,
      pending_lost,
      pending_found
    });

    res.send(html);
  } catch (err) {
    console.error('Admin dashboard error:', err);
    res.status(500).send('Database Error: ' + escapeHtml(err.message));
  }
});

// Pending Posts Review GET
app.get(['/pending-posts.php', '/pending-posts'], requireAdmin, async (req, res) => {
  const id = parseInt(req.query.id, 10);
  const type = req.query.type;
  const csrfToken = getCsrfToken(req);

  try {
    if (id && type) {
      let item = null;
      if (type === 'lost') {
        const rows = await query(`
          SELECT l.*, u.full_name, u.student_id, u.email, u.department
          FROM lost_items l
          LEFT JOIN users u ON l.user_id = u.user_id
          WHERE l.lost_id = ?
          LIMIT 1
        `, [id]);
        if (rows.length > 0) item = rows[0];
      } else {
        const rows = await query(`
          SELECT f.*, u.full_name, u.student_id, u.email, u.department
          FROM found_items f
          LEFT JOIN users u ON f.user_id = u.user_id
          WHERE f.found_id = ?
          LIMIT 1
        `, [id]);
        if (rows.length > 0) item = rows[0];
      }

      if (!item) return res.status(404).send('Post not found.');
      return res.send(renderPendingPostsDetail({ item, type, csrfToken }));
    }

    const [pending_lost, pending_found] = await Promise.all([
      query(`
        SELECT l.lost_id, l.item_name, l.category, l.lost_location, l.lost_date, l.status, u.full_name
        FROM lost_items l
        LEFT JOIN users u ON l.user_id = u.user_id
        WHERE l.status = 'Pending'
        ORDER BY l.lost_id DESC
      `),
      query(`
        SELECT f.found_id, f.item_name, f.category, f.found_location, f.found_date, f.status, u.full_name
        FROM found_items f
        LEFT JOIN users u ON f.user_id = u.user_id
        WHERE f.status = 'Pending'
        ORDER BY f.found_id DESC
      `)
    ]);

    res.send(renderPendingPostsList({ pending_lost, pending_found, csrfToken }));
  } catch (err) {
    console.error('Pending posts error:', err);
    res.status(500).send('Database Error: ' + escapeHtml(err.message));
  }
});

// Approve Post POST
app.post(['/approve-post.php', '/approve-post'], requireAdmin, async (req, res) => {
  const id = parseInt(req.body.id, 10);
  const type = req.body.type;

  if (!id || !type) {
    return res.status(400).send('Invalid request.');
  }

  try {
    if (type === 'lost') {
      const lostRows = await query('SELECT * FROM lost_items WHERE lost_id = ? LIMIT 1', [id]);
      if (lostRows.length === 0) return res.status(404).send('Lost item not found.');
      const lost = lostRows[0];

      await execute("UPDATE lost_items SET status = 'Approved' WHERE lost_id = ?", [id]);

      await execute(`
        INSERT INTO notifications (user_id, match_id, title, message, is_read, receiver)
        VALUES (?, NULL, 'Post Approved', ?, 0, 'user')
      `, [lost.user_id, `Your lost item post '${lost.item_name}' has been approved by the admin.`]);

      const approvedFound = await query("SELECT * FROM found_items WHERE status = 'Approved'");
      for (const found of approvedFound) {
        const scores = calculateAdminMatchScores(lost, found);
        if (scores.matchPercentage >= 80) {
          const matchCheck = await query('SELECT match_id FROM matches WHERE lost_id = ? AND found_id = ? LIMIT 1', [lost.lost_id, found.found_id]);
          let matchId = null;
          if (matchCheck.length === 0) {
            const result = await execute(`
              INSERT INTO matches
              (lost_id, found_id, item_name_score, description_score, category_score, location_score, date_score, match_percentage, status)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Pending')
            `, [
              lost.lost_id,
              found.found_id,
              scores.itemNameScore,
              scores.descriptionScore,
              scores.categoryScore,
              scores.locationScore,
              scores.dateScore,
              scores.matchPercentage
            ]);
            matchId = result.insertId;
          } else {
            matchId = matchCheck[0].match_id;
          }

          if (matchId) {
            await execute(`
              INSERT INTO notifications (user_id, match_id, title, message, is_read, receiver)
              VALUES (?, ?, 'Possible Match Found', ?, 0, 'user')
            `, [
              lost.user_id,
              matchId,
              `A possible match was found for your lost item '${lost.item_name}'. Match percentage: ${scores.matchPercentage.toFixed(2)}%.`
            ]);
            await execute(`
              INSERT INTO notifications (user_id, match_id, title, message, is_read, receiver)
              VALUES (?, ?, 'Possible Match Found', ?, 0, 'user')
            `, [
              found.user_id,
              matchId,
              `A possible match was found for the item you found '${found.item_name}'. Match percentage: ${scores.matchPercentage.toFixed(2)}%.`
            ]);
          }
        }
      }
    } else if (type === 'found') {
      const foundRows = await query('SELECT * FROM found_items WHERE found_id = ? LIMIT 1', [id]);
      if (foundRows.length === 0) return res.status(404).send('Found item not found.');
      const found = foundRows[0];

      await execute("UPDATE found_items SET status = 'Approved' WHERE found_id = ?", [id]);

      await execute(`
        INSERT INTO notifications (user_id, match_id, title, message, is_read, receiver)
        VALUES (?, NULL, 'Post Approved', ?, 0, 'user')
      `, [found.user_id, `Your found item post '${found.item_name}' has been approved by the admin.`]);

      const approvedLost = await query("SELECT * FROM lost_items WHERE status = 'Approved'");
      for (const lost of approvedLost) {
        const scores = calculateAdminMatchScores(lost, found);
        if (scores.matchPercentage >= 80) {
          const matchCheck = await query('SELECT match_id FROM matches WHERE lost_id = ? AND found_id = ? LIMIT 1', [lost.lost_id, found.found_id]);
          let matchId = null;
          if (matchCheck.length === 0) {
            const result = await execute(`
              INSERT INTO matches
              (lost_id, found_id, item_name_score, description_score, category_score, location_score, date_score, match_percentage, status)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Pending')
            `, [
              lost.lost_id,
              found.found_id,
              scores.itemNameScore,
              scores.descriptionScore,
              scores.categoryScore,
              scores.locationScore,
              scores.dateScore,
              scores.matchPercentage
            ]);
            matchId = result.insertId;
          } else {
            matchId = matchCheck[0].match_id;
          }

          if (matchId) {
            await execute(`
              INSERT INTO notifications (user_id, match_id, title, message, is_read, receiver)
              VALUES (?, ?, 'Possible Match Found', ?, 0, 'user')
            `, [
              lost.user_id,
              matchId,
              `A possible match was found for your lost item '${lost.item_name}'. Match percentage: ${scores.matchPercentage.toFixed(2)}%.`
            ]);
            await execute(`
              INSERT INTO notifications (user_id, match_id, title, message, is_read, receiver)
              VALUES (?, ?, 'Possible Match Found', ?, 0, 'user')
            `, [
              found.user_id,
              matchId,
              `A possible match was found for the item you found '${found.item_name}'. Match percentage: ${scores.matchPercentage.toFixed(2)}%.`
            ]);
          }
        }
      }
    }

    res.redirect('/pending-posts.php');
  } catch (err) {
    console.error('Approve post error:', err);
    res.status(500).send('Database Error: ' + escapeHtml(err.message));
  }
});

// Reject Post POST
app.post(['/reject-post.php', '/reject-post'], requireAdmin, async (req, res) => {
  const id = parseInt(req.body.id, 10);
  const type = req.body.type;

  if (!id || !type) {
    return res.status(400).send('Invalid request.');
  }

  try {
    if (type === 'lost') {
      const lostRows = await query('SELECT * FROM lost_items WHERE lost_id = ? LIMIT 1', [id]);
      if (lostRows.length === 0) return res.status(404).send('Lost item not found.');
      await execute('UPDATE lost_items SET status = "Rejected" WHERE lost_id = ?', [id]);
      await execute(`
        INSERT INTO notifications (user_id, match_id, title, message, is_read, receiver)
        VALUES (?, NULL, 'Post Rejected', ?, 0, 'user')
      `, [lostRows[0].user_id, `Your lost item post '${lostRows[0].item_name}' has been rejected by the admin.`]);
    } else {
      const foundRows = await query('SELECT * FROM found_items WHERE found_id = ? LIMIT 1', [id]);
      if (foundRows.length === 0) return res.status(404).send('Found item not found.');
      await execute('UPDATE found_items SET status = "Rejected" WHERE found_id = ?', [id]);
      await execute(`
        INSERT INTO notifications (user_id, match_id, title, message, is_read, receiver)
        VALUES (?, NULL, 'Post Rejected', ?, 0, 'user')
      `, [foundRows[0].user_id, `Your found item post '${foundRows[0].item_name}' has been rejected by the admin.`]);
    }

    res.redirect('/pending-posts.php');
  } catch (err) {
    console.error('Reject post error:', err);
    res.status(500).send('Database Error: ' + escapeHtml(err.message));
  }
});

// Delete Posts GET & POST
app.all(['/delete-posts.php', '/delete-posts'], requireAdmin, async (req, res) => {
  if (req.method === 'POST' || req.query.delete_lost || req.query.delete_found) {
    const deleteLostId = parseInt(req.body.delete_lost || req.query.delete_lost, 10);
    const deleteFoundId = parseInt(req.body.delete_found || req.query.delete_found, 10);

    try {
      if (deleteLostId) {
        await execute('DELETE FROM notifications WHERE match_id IN (SELECT match_id FROM matches WHERE lost_id = ?)', [deleteLostId]);
        await execute('DELETE FROM matches WHERE lost_id = ?', [deleteLostId]);
        await execute('DELETE FROM lost_items WHERE lost_id = ?', [deleteLostId]);
      } else if (deleteFoundId) {
        await execute('DELETE FROM notifications WHERE match_id IN (SELECT match_id FROM matches WHERE found_id = ?)', [deleteFoundId]);
        await execute('DELETE FROM matches WHERE found_id = ?', [deleteFoundId]);
        await execute('DELETE FROM found_items WHERE found_id = ?', [deleteFoundId]);
      }
      return res.redirect('/delete-posts.php');
    } catch (err) {
      console.error('Delete post error:', err);
      return res.status(500).send('Database Error: ' + escapeHtml(err.message));
    }
  }

  try {
    const [lostPosts, foundPosts] = await Promise.all([
      query(`
        SELECT l.lost_id, l.item_name, l.category, l.status, u.full_name
        FROM lost_items l
        LEFT JOIN users u ON l.user_id = u.user_id
        ORDER BY l.lost_id DESC
      `),
      query(`
        SELECT f.found_id, f.item_name, f.category, f.status, u.full_name
        FROM found_items f
        LEFT JOIN users u ON f.user_id = u.user_id
        ORDER BY f.found_id DESC
      `)
    ]);

    const csrfToken = getCsrfToken(req);
    const html = renderDeletePostsView({ lostPosts, foundPosts, csrfToken });
    res.send(html);
  } catch (err) {
    console.error('Delete posts view error:', err);
    res.status(500).send('Database Error: ' + escapeHtml(err.message));
  }
});

// Manage Users GET & POST
app.all(['/manage-users.php', '/manage-users'], requireAdmin, async (req, res) => {
  if (req.method === 'POST' || req.query.delete_id) {
    const deleteUserId = parseInt(req.body.delete_id || req.query.delete_id, 10);
    if (deleteUserId) {
      try {
        await execute('DELETE FROM notifications WHERE user_id = ?', [deleteUserId]);
        await execute('DELETE FROM users WHERE user_id = ?', [deleteUserId]);
        return res.redirect('/manage-users.php?deleted=1');
      } catch (err) {
        console.error('Delete user error:', err);
        return res.status(500).send('Database Error: ' + escapeHtml(err.message));
      }
    }
  }

  try {
    const users = await query('SELECT user_id, full_name, student_id, email, department, created_at FROM users ORDER BY user_id DESC');
    const csrfToken = getCsrfToken(req);
    const html = renderManageUsersView({
      users,
      deleted: req.query.deleted === '1',
      csrfToken
    });
    res.send(html);
  } catch (err) {
    console.error('Manage users error:', err);
    res.status(500).send('Database Error: ' + escapeHtml(err.message));
  }
});

// Returned Items GET
app.get(['/returned-items.php', '/returned-items'], requireAdmin, async (req, res) => {
  try {
    const [lostItems, foundItems] = await Promise.all([
      query(`
        SELECT l.lost_id, l.item_name, l.category, u.full_name AS owner_name, l.status
        FROM lost_items l
        LEFT JOIN users u ON l.user_id = u.user_id
        WHERE l.status = 'Returned'
        ORDER BY l.lost_id DESC
      `),
      query(`
        SELECT f.found_id, f.item_name, f.category, u.full_name AS owner_name, f.status
        FROM found_items f
        LEFT JOIN users u ON f.user_id = u.user_id
        WHERE f.status = 'Returned'
        ORDER BY f.found_id DESC
      `)
    ]);

    const html = renderReturnedItemsView({ lostItems, foundItems });
    res.send(html);
  } catch (err) {
    console.error('Returned items error:', err);
    res.status(500).send('Database Error: ' + escapeHtml(err.message));
  }
});

// Admin Approved Claims GET
app.get(['/admin-approved-claims.php', '/admin-approved-claims'], requireAdmin, async (req, res) => {
  try {
    const claims = await query(`
      SELECT
        m.match_id,
        m.lost_id,
        m.found_id,
        m.match_percentage,
        m.claim_status,
        m.created_at,

        owner.user_id AS owner_id,
        owner.full_name AS owner_name,
        owner.student_id AS owner_student_id,
        owner.email AS owner_email,
        owner.department AS owner_department,

        l.item_name AS lost_item_name,

        finder.user_id AS finder_id,
        finder.full_name AS finder_name,
        finder.student_id AS finder_student_id,
        finder.email AS finder_email,
        finder.department AS finder_department,

        f.item_name AS found_item_name

      FROM matches m
      INNER JOIN lost_items l ON m.lost_id = l.lost_id
      INNER JOIN found_items f ON m.found_id = f.found_id
      LEFT JOIN users owner ON l.user_id = owner.user_id
      LEFT JOIN users finder ON f.user_id = finder.user_id
      WHERE m.claim_status = 'Approved'
      ORDER BY m.match_id DESC
    `);

    const html = renderAdminApprovedClaimsView({ claims });
    res.send(html);
  } catch (err) {
    console.error('Admin approved claims error:', err);
    res.status(500).send('Database Error: ' + escapeHtml(err.message));
  }
});

// View Lost Items (Admin)
app.get(['/view-lost-items.php', '/view-lost-items'], requireAdmin, async (req, res) => {
  const id = parseInt(req.query.id, 10);
  try {
    if (id) {
      const items = await query(`
        SELECT l.*, u.full_name, u.student_id, u.email, u.department
        FROM lost_items l
        LEFT JOIN users u ON l.user_id = u.user_id
        WHERE l.lost_id = ?
        LIMIT 1
      `, [id]);
      if (items.length === 0) return res.status(404).send('Lost item not found.');
      return res.send(renderLostItemDetail({ item: items[0] }));
    }

    const items = await query(`
      SELECT l.lost_id, l.user_id, l.item_name, l.category, l.description, l.secret_information, l.lost_date, l.lost_location, l.status,
             (CASE WHEN LENGTH(l.item_image) > 255 THEN 'data:image' ELSE l.item_image END) AS item_image,
             u.full_name
      FROM lost_items l
      LEFT JOIN users u ON l.user_id = u.user_id
      ORDER BY l.lost_id DESC
    `);
    res.send(renderLostItemsList({ items }));
  } catch (err) {
    console.error('View lost items error:', err);
    res.status(500).send('Database Error: ' + escapeHtml(err.message));
  }
});

// View Found Items (Admin)
app.get(['/view-found-items.php', '/view-found-items'], requireAdmin, async (req, res) => {
  const id = parseInt(req.query.id, 10);
  try {
    if (id) {
      const items = await query(`
        SELECT f.*, u.full_name, u.student_id, u.email, u.department
        FROM found_items f
        LEFT JOIN users u ON f.user_id = u.user_id
        WHERE f.found_id = ?
        LIMIT 1
      `, [id]);
      if (items.length === 0) return res.status(404).send('Found item not found.');
      return res.send(renderFoundItemDetail({ item: items[0] }));
    }

    const items = await query(`
      SELECT f.*, u.full_name
      FROM found_items f
      LEFT JOIN users u ON f.user_id = u.user_id
      ORDER BY f.found_id DESC
    `);
    res.send(renderFoundItemsList({ items }));
  } catch (err) {
    console.error('View found items error:', err);
    res.status(500).send('Database Error: ' + escapeHtml(err.message));
  }
});

// Fallback 404 handler
app.use((req, res) => {
  res.status(404).send(`
    <!DOCTYPE html>
    <html>
    <head><title>404 Not Found</title><link rel="stylesheet" href="css/style.css"></head>
    <body style="font-family: Arial; text-align: center; padding: 50px;">
      <h2>404 - Page Not Found</h2>
      <p>The requested page <code>${escapeHtml(req.url)}</code> could not be found.</p>
      <a href="dashboard.php" class="btn" style="display:inline-block; margin-top:20px; padding:10px 20px; background:#003844; color:white; text-decoration:none; border-radius:6px;">Go to Dashboard</a>
    </body>
    </html>
  `);
});

module.exports = app;
