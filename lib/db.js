const path = require('path');
const fs = require('fs');
const { Pool: PgPool } = require('pg');
const mysql = require('mysql2/promise');
const initSqlJs = require('sql.js');
const seedData = require('./seedData');

let dbDriver = null; // 'postgres', 'mysql', or 'sqlite'
let pgPool = null;
let mysqlPool = null;
let sqliteDb = null;
let initPromise = null;

// Normalizes PostgreSQL / Supabase connection options
function getPgConfig() {
  const url = process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.SUPABASE_URL;
  if (url && (url.startsWith('postgres://') || url.startsWith('postgresql://'))) {
    return {
      connectionString: url,
      ssl: { rejectUnauthorized: false }
    };
  }

  const host = process.env.DB_HOST || 'aws-1-ap-south-1.pooler.supabase.com';
  const port = parseInt(process.env.DB_PORT || '6543', 10);
  const user = process.env.DB_USER || 'postgres.bmwtijjrsskkbabueibd';
  const password = process.env.DB_PASS || process.env.DB_PASSWORD || 'shreyasabiha@gmail.com';
  const database = process.env.DB_NAME || 'postgres';

  return {
    host,
    port,
    user,
    password,
    database,
    ssl: { rejectUnauthorized: false }
  };
}

// Normalizes MySQL connection options from env
function getMysqlConfig() {
  const url = process.env.MYSQL_URL;
  if (url) {
    return {
      uri: url,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      ssl: process.env.DB_SSL === 'false' ? false : { rejectUnauthorized: false }
    };
  }

  const host = process.env.MYSQL_HOST;
  if (!host) {
    return null;
  }

  return {
    host: host,
    port: parseInt(process.env.MYSQL_PORT || '3306', 10),
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASS || process.env.MYSQL_PASSWORD || '',
    database: process.env.MYSQL_NAME || 'campus_lost_found',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
  };
}

async function initPg(cfg) {
  const pool = new PgPool({
    ...cfg,
    max: 10,
    idleTimeoutMillis: 300000,
    connectionTimeoutMillis: 30000
  });
  pool.on('error', (err) => {
    console.warn('[DB] Supabase pool idle client warning:', err.message);
  });
  // Quick test connection
  await pool.query('SELECT 1');
  pgPool = pool;
  dbDriver = 'postgres';
  console.log('[DB] Connected to Supabase (PostgreSQL) successfully.');
}

async function initMysql(cfg) {
  const pool = mysql.createPool(cfg);
  await pool.query('SELECT 1');
  mysqlPool = pool;
  dbDriver = 'mysql';
  console.log('[DB] Connected to MySQL database successfully.');
}

async function initSqlite() {
  const possiblePaths = [
    path.join(__dirname, 'sql-wasm.wasm'),
    path.join(__dirname, '../public/sql-wasm.wasm'),
    path.join(__dirname, '../node_modules/sql.js/dist/sql-wasm.wasm'),
    path.join(process.cwd(), 'public/sql-wasm.wasm'),
    path.join(process.cwd(), 'node_modules/sql.js/dist/sql-wasm.wasm')
  ];

  let wasmBinaryPath = null;
  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      wasmBinaryPath = p;
      break;
    }
  }

  const SQL = await initSqlJs(wasmBinaryPath ? { locateFile: () => wasmBinaryPath } : undefined);
  const db = new SQL.Database();

  // Create tables
  db.run(`
    CREATE TABLE IF NOT EXISTS admins (
      username TEXT PRIMARY KEY,
      password TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS users (
      user_id INTEGER PRIMARY KEY AUTOINCREMENT,
      full_name TEXT NOT NULL,
      student_id TEXT NOT NULL UNIQUE,
      email TEXT NOT NULL UNIQUE,
      department TEXT NOT NULL,
      password TEXT NOT NULL,
      role TEXT DEFAULT 'user',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS found_items (
      found_id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      item_name TEXT NOT NULL,
      category TEXT NOT NULL,
      description TEXT,
      found_date TEXT NOT NULL,
      found_location TEXT NOT NULL,
      finder_contact_information TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'Pending',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      item_image TEXT DEFAULT NULL
    );

    CREATE TABLE IF NOT EXISTS lost_items (
      lost_id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      item_name TEXT NOT NULL,
      category TEXT NOT NULL,
      lost_date TEXT NOT NULL,
      lost_location TEXT NOT NULL,
      contact_information TEXT NOT NULL,
      secret_information TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'Pending',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      description TEXT,
      item_image TEXT DEFAULT NULL
    );

    CREATE TABLE IF NOT EXISTS matches (
      match_id INTEGER PRIMARY KEY AUTOINCREMENT,
      lost_id INTEGER NOT NULL,
      found_id INTEGER NOT NULL,
      item_name_score REAL DEFAULT 0.00,
      description_score REAL DEFAULT 0.00,
      category_score REAL DEFAULT 0.00,
      location_score REAL DEFAULT 0.00,
      date_score REAL DEFAULT 0.00,
      match_percentage REAL NOT NULL,
      status TEXT DEFAULT 'Pending',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      finder_status TEXT DEFAULT 'Pending',
      owner_status TEXT DEFAULT 'Pending',
      claim_status TEXT NOT NULL DEFAULT 'Not Claimed'
    );

    CREATE TABLE IF NOT EXISTS notifications (
      notification_id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      match_id INTEGER DEFAULT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      is_read INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      receiver TEXT DEFAULT NULL
    );
  `);

  // Seed data
  for (const a of seedData.admins) {
    db.run("INSERT OR IGNORE INTO admins (username, password) VALUES (?, ?)", [a.username, a.password]);
  }
  for (const u of seedData.users) {
    db.run(
      "INSERT OR IGNORE INTO users (user_id, full_name, student_id, email, department, password, role, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      [u.user_id, u.full_name, u.student_id, u.email, u.department, u.password, u.role, u.created_at]
    );
  }

  sqliteDb = db;
  dbDriver = 'sqlite';
  console.log('[DB] Running in embedded SQLite mode with seed data.');
}

async function ensureDb() {
  if (dbDriver) return;
  if (!initPromise) {
    initPromise = (async () => {
      // 1. Try PostgreSQL (Supabase)
      const pgCfg = getPgConfig();
      if (pgCfg) {
        try {
          await initPg(pgCfg);
          return;
        } catch (err) {
          console.warn('[DB] Supabase PG connection failed:', err.message);
        }
      }

      // 2. Try MySQL
      const myCfg = getMysqlConfig();
      if (myCfg) {
        try {
          await initMysql(myCfg);
          return;
        } catch (err) {
          console.warn('[DB] MySQL connection failed:', err.message);
        }
      }

      // 3. Fallback to embedded SQLite
      await initSqlite();
    })();
  }
  await initPromise;
}

// Unified query method
async function query(sql, params = []) {
  await ensureDb();

  // POSTGRESQL (SUPABASE)
  if (dbDriver === 'postgres') {
    let cleanSql = sql.replace(/`/g, '');
    cleanSql = cleanSql.replace(/NOW\(\)/gi, 'CURRENT_TIMESTAMP');
    cleanSql = cleanSql.replace(/INSERT\s+IGNORE\s+INTO/gi, 'INSERT INTO');
    cleanSql = cleanSql.replace(/"(Approved|Pending|Rejected|Returned|Claim Approved|Not Claimed|user|admin)"/gi, "'$1'");

    // Convert ? placeholders to $1, $2, $3
    let pIdx = 1;
    cleanSql = cleanSql.replace(/\?/g, () => `$${pIdx++}`);

    const isSelect = /^\s*SELECT/i.test(cleanSql);
    const isInsert = /^\s*INSERT\s+INTO/i.test(cleanSql);

    if (isInsert && !/RETURNING/i.test(cleanSql)) {
      cleanSql += ' RETURNING *';
    }

    let res;
    try {
      res = await pgPool.query(cleanSql, params || []);
    } catch (queryErr) {
      if (/ECONNRESET|Connection terminated|timeout|broken pipe|ENOTFOUND/i.test(queryErr.message)) {
        console.warn('[DB] Retrying Supabase query after drop:', queryErr.message);
        await new Promise(r => setTimeout(r, 500));
        res = await pgPool.query(cleanSql, params || []);
      } else {
        throw queryErr;
      }
    }

    if (isSelect) {
      return res.rows;
    }

    let insertId = 0;
    if (res.rows && res.rows[0]) {
      const r = res.rows[0];
      insertId = r.user_id || r.found_id || r.lost_id || r.match_id || r.notification_id || 0;
    }

    return { insertId, affectedRows: res.rowCount };
  }

  // MYSQL
  if (dbDriver === 'mysql') {
    const [rows] = await mysqlPool.query(sql, params);
    return rows;
  }

  // SQLITE
  let cleanSql = sql.trim();
  cleanSql = cleanSql.replace(/NOW\(\)/gi, "datetime('now', 'localtime')");

  if (/^\s*SELECT/i.test(cleanSql)) {
    const stmt = sqliteDb.prepare(cleanSql);
    if (params && params.length > 0) {
      stmt.bind(params.map(p => (p === undefined ? null : p)));
    }
    const results = [];
    while (stmt.step()) {
      results.push(stmt.getAsObject());
    }
    stmt.free();
    return results;
  }

  sqliteDb.run(cleanSql, params ? params.map(p => (p === undefined ? null : p)) : []);
  const lastId = sqliteDb.exec("SELECT last_insert_rowid() as id");
  const insertId = lastId && lastId[0] && lastId[0].values && lastId[0].values[0] ? lastId[0].values[0][0] : 0;
  const changes = sqliteDb.getRowsModified();
  return { insertId, affectedRows: changes };
}

module.exports = {
  query,
  execute: query,
  getDbMode: () => dbDriver,
  ensureDb
};
