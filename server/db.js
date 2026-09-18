import sqlite3 from 'sqlite3';
import path from 'path';
import fs from 'fs';
import bcrypt from 'bcryptjs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Directories setup
const dataDir = path.join(__dirname, 'data');
const uploadsDir = path.join(__dirname, '..', 'uploads');
const photosDir = path.join(uploadsDir, 'photos');
const thumbnailsDir = path.join(uploadsDir, 'thumbnails');
const bannersDir = path.join(uploadsDir, 'banners');
const avatarsDir = path.join(uploadsDir, 'avatars');

[dataDir, uploadsDir, photosDir, thumbnailsDir, bannersDir, avatarsDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

const dbPath = path.join(dataDir, 'gallery.db');
const db = new sqlite3.Database(dbPath);

// Helper wrapper for async sqlite3 queries
export const runQuery = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve({ id: this.lastID, changes: this.changes });
    });
  });
};

export const getRow = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

export const getAll = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows || []);
    });
  });
};

// SVG Placeholder generator helper for initial sample photos
const createSampleSVGImage = (filePath, width, height, title, subtitle, bgColor = '#3b82f6') => {
  const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <defs>
      <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:${bgColor};stop-opacity:1" />
        <stop offset="100%" style="stop-color:#1e293b;stop-opacity:1" />
      </linearGradient>
    </defs>
    <rect width="100%" height="100%" fill="url(#grad)" />
    <circle cx="${width/2}" cy="${height/2 - 30}" r="60" fill="rgba(255,255,255,0.15)" />
    <path d="M${width/2 - 40} ${height/2 - 10} L${width/2} ${height/2 - 50} L${width/2 + 40} ${height/2 - 10} Z" fill="rgba(255,255,255,0.4)" />
    <text x="50%" y="${height/2 + 50}" font-family="Arial, sans-serif" font-size="28" font-weight="bold" fill="#ffffff" text-anchor="middle">${title}</text>
    <text x="50%" y="${height/2 + 85}" font-family="Arial, sans-serif" font-size="18" fill="#e2e8f0" text-anchor="middle">${subtitle}</text>
  </svg>`;
  fs.writeFileSync(filePath, svgContent);
};

export const initDatabase = async () => {
  console.log('Inicializando banco de dados SQLite...');

  // Enable foreign keys
  await runQuery('PRAGMA foreign_keys = ON;');

  // Users table
  await runQuery(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'Usuário',
      status TEXT NOT NULL DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Event Categories table
  await runQuery(`
    CREATE TABLE IF NOT EXISTS event_categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Family Nuclei table
  await runQuery(`
    CREATE TABLE IF NOT EXISTS family_nuclei (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      cover_url TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Family Members table
  await runQuery(`
    CREATE TABLE IF NOT EXISTS family_members (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nucleus_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      avatar_url TEXT,
      birth_date TEXT,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (nucleus_id) REFERENCES family_nuclei(id) ON DELETE CASCADE
    );
  `);

  // Events table
  await runQuery(`
    CREATE TABLE IF NOT EXISTS events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      category_id INTEGER,
      nucleus_id INTEGER,
      date TEXT,
      location TEXT,
      description TEXT,
      cover_url TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (category_id) REFERENCES event_categories(id) ON DELETE SET NULL,
      FOREIGN KEY (nucleus_id) REFERENCES family_nuclei(id) ON DELETE SET NULL
    );
  `);

  // Photos table
  await runQuery(`
    CREATE TABLE IF NOT EXISTS photos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      filename TEXT NOT NULL,
      original_name TEXT NOT NULL,
      mime_type TEXT NOT NULL,
      size INTEGER NOT NULL,
      width INTEGER DEFAULT 0,
      height INTEGER DEFAULT 0,
      filepath TEXT NOT NULL,
      thumbnail_path TEXT NOT NULL,
      title TEXT,
      description TEXT,
      event_id INTEGER,
      nucleus_id INTEGER,
      date TEXT,
      location TEXT,
      tags TEXT,
      uploaded_by INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE SET NULL,
      FOREIGN KEY (nucleus_id) REFERENCES family_nuclei(id) ON DELETE SET NULL,
      FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE SET NULL
    );
  `);

  // Photo Members junction table
  await runQuery(`
    CREATE TABLE IF NOT EXISTS photo_members (
      photo_id INTEGER NOT NULL,
      member_id INTEGER NOT NULL,
      PRIMARY KEY (photo_id, member_id),
      FOREIGN KEY (photo_id) REFERENCES photos(id) ON DELETE CASCADE,
      FOREIGN KEY (member_id) REFERENCES family_members(id) ON DELETE CASCADE
    );
  `);

  // Albums / Collections table
  await runQuery(`
    CREATE TABLE IF NOT EXISTS albums (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      cover_url TEXT,
      created_by INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
    );
  `);

  // Album Photos junction table
  await runQuery(`
    CREATE TABLE IF NOT EXISTS album_photos (
      album_id INTEGER NOT NULL,
      photo_id INTEGER NOT NULL,
      PRIMARY KEY (album_id, photo_id),
      FOREIGN KEY (album_id) REFERENCES albums(id) ON DELETE CASCADE,
      FOREIGN KEY (photo_id) REFERENCES photos(id) ON DELETE CASCADE
    );
  `);

  // Banners table
  await runQuery(`
    CREATE TABLE IF NOT EXISTS banners (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      image_url TEXT NOT NULL,
      button_text TEXT,
      button_link TEXT,
      active INTEGER DEFAULT 1,
      display_order INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // System Settings table
  await runQuery(`
    CREATE TABLE IF NOT EXISTS system_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);

  // Indexes for performance
  await runQuery(`CREATE INDEX IF NOT EXISTS idx_photos_date ON photos(date);`);
  await runQuery(`CREATE INDEX IF NOT EXISTS idx_photos_event ON photos(event_id);`);
  await runQuery(`CREATE INDEX IF NOT EXISTS idx_photos_nucleus ON photos(nucleus_id);`);
  await runQuery(`CREATE INDEX IF NOT EXISTS idx_events_date ON events(date);`);

  // Seed default data if empty
  await seedInitialData();
};

const seedInitialData = async () => {
  // Check users count
  const userCountRow = await getRow('SELECT COUNT(*) as count FROM users');
  if (userCountRow && userCountRow.count === 0) {
    console.log('Semeando dados iniciais para a Galeria Digital...');

    // Passwords hashing
    const adminPassword = await bcrypt.hash('admin123', 10);
    const userPassword = await bcrypt.hash('user123', 10);

    // Default users
    const adminResult = await runQuery(
      `INSERT INTO users (name, username, email, password_hash, role, status) VALUES (?, ?, ?, ?, ?, ?)`,
      ['Administrador do Acervo', 'admin', 'admin@galeria.com', adminPassword, 'Administrador', 'active']
    );

    await runQuery(
      `INSERT INTO users (name, username, email, password_hash, role, status) VALUES (?, ?, ?, ?, ?, ?)`,
      ['Membro da Família', 'familia', 'familia@galeria.com', userPassword, 'Usuário', 'active']
    );

    // Default categories
    const categories = [
      'Aniversário', 'Casamento', 'Batizado', 'Reunião Familiar',
      'Natal', 'Ano Novo', 'Viagem', 'Festa', 'Formatura', 'Encontro Familiar', 'Outros'
    ];

    for (const cat of categories) {
      await runQuery(`INSERT INTO event_categories (name, description) VALUES (?, ?)`, [cat, `Fotos relativas a ${cat}`]);
    }

    // Default Family Nuclei
    const nucleusRibeiro = await runQuery(
      `INSERT INTO family_nuclei (name, description) VALUES (?, ?)`,
      ['Família Ribeiro', 'Núcleo familiar da linhagem patriarcal Ribeiro, recordações de celebrações e viagens.']
    );

    const nucleusSilva = await runQuery(
      `INSERT INTO family_nuclei (name, description) VALUES (?, ?)`,
      ['Família Silva', 'Núcleo familiar da linhagem Silva, encontros de domingo e memórias de infância.']
    );

    // Default Family Members
    const memberAdailton = await runQuery(
      `INSERT INTO family_members (nucleus_id, name, birth_date, description) VALUES (?, ?, ?, ?)`,
      [nucleusRibeiro.id, 'Vovô Adailton', '1952-08-14', 'Patriarca da Família Ribeiro, apaixonado por fotografia e viagens.']
    );

    const memberMaria = await runQuery(
      `INSERT INTO family_members (nucleus_id, name, birth_date, description) VALUES (?, ?, ?, ?)`,
      [nucleusRibeiro.id, 'Maria Ribeiro', '1955-03-22', 'Matriarca, organizadora dos almoços de Natal e datas especiais.']
    );

    const memberLucas = await runQuery(
      `INSERT INTO family_members (nucleus_id, name, birth_date, description) VALUES (?, ?, ?, ?)`,
      [nucleusSilva.id, 'Lucas Silva', '1988-11-05', 'Filho mais velho da Família Silva, músico e fotógrafo amador.']
    );

    const memberJuliana = await runQuery(
      `INSERT INTO family_members (nucleus_id, name, birth_date, description) VALUES (?, ?, ?, ?)`,
      [nucleusSilva.id, 'Juliana Silva', '1992-05-18', 'Engenheira, adora viagens em família e praias.']
    );

    // Default Events
    const catAniversario = await getRow(`SELECT id FROM event_categories WHERE name = 'Aniversário'`);
    const catNatal = await getRow(`SELECT id FROM event_categories WHERE name = 'Natal'`);
    const catViagem = await getRow(`SELECT id FROM event_categories WHERE name = 'Viagem'`);

    const eventNiverAdailton = await runQuery(
      `INSERT INTO events (name, category_id, nucleus_id, date, location, description) VALUES (?, ?, ?, ?, ?, ?)`,
      ['Aniversário de 70 Anos do Vovô Adailton', catAniversario.id, nucleusRibeiro.id, '2026-08-14', 'Sítio Recanto dos Sabiás - SP', 'Festa especial reunindo toda a família para celebrar os 70 anos.']
    );

    const eventNatal2025 = await runQuery(
      `INSERT INTO events (name, category_id, nucleus_id, date, location, description) VALUES (?, ?, ?, ?, ?, ?)`,
      ['Ceia de Natal em Família 2025', catNatal.id, nucleusRibeiro.id, '2025-12-25', 'Casa do Vovô Adailton', 'Reunião tradicional de Natal com troca de presentes e ceia em família.']
    );

    const eventViagemGramado = await runQuery(
      `INSERT INTO events (name, category_id, nucleus_id, date, location, description) VALUES (?, ?, ?, ?, ?, ?)`,
      ['Viagem de Férias a Gramado', catViagem.id, nucleusSilva.id, '2026-01-15', 'Gramado - RS', 'Passeios pelas hortênsias, parque de neve e jantares aconchegantes.']
    );

    // Create sample photo files (SVG)
    const samplePhotos = [
      {
        filename: 'foto_niver_70.svg',
        title: 'Foto Oficial da Família no Aniversário',
        description: 'Toda a família reunida em volta do bolo de 70 anos do Vovô Adailton.',
        event_id: eventNiverAdailton.id,
        nucleus_id: nucleusRibeiro.id,
        date: '2026-08-14',
        location: 'Sítio Recanto dos Sabiás',
        tags: 'aniversario, festa, bolo, familia',
        bg: '#d97706',
        members: [memberAdailton.id, memberMaria.id]
      },
      {
        filename: 'foto_brinde_niver.svg',
        title: 'Momentos do Brinde',
        description: 'Vovô Adailton e Dona Maria brindando durante o discurso.',
        event_id: eventNiverAdailton.id,
        nucleus_id: nucleusRibeiro.id,
        date: '2026-08-14',
        location: 'Sítio Recanto dos Sabiás',
        tags: 'brinde, emocao, discurso',
        bg: '#b45309',
        members: [memberAdailton.id, memberMaria.id]
      },
      {
        filename: 'foto_natal_arvore.svg',
        title: 'Decoração da Árvore de Natal',
        description: 'Montagem da árvore de Natal com as luzes e enfeites de madeira.',
        event_id: eventNatal2025.id,
        nucleus_id: nucleusRibeiro.id,
        date: '2025-12-25',
        location: 'Casa da Família',
        tags: 'natal, arvore, presentes',
        bg: '#15803d',
        members: [memberMaria.id]
      },
      {
        filename: 'foto_gramado_lago.svg',
        title: 'Passeio no Lago Negro',
        description: 'Manhã ensolarada pedalando no pedalinho do Lago Negro.',
        event_id: eventViagemGramado.id,
        nucleus_id: nucleusSilva.id,
        date: '2026-01-15',
        location: 'Gramado - RS',
        tags: 'viagem, gramado, lago, sol',
        bg: '#0284c7',
        members: [memberLucas.id, memberJuliana.id]
      },
      {
        filename: 'foto_gramado_frio.svg',
        title: 'Café Colonial em Gramado',
        description: 'Mesa farta de café colonial com toda a variedade de pães e tortas.',
        event_id: eventViagemGramado.id,
        nucleus_id: nucleusSilva.id,
        date: '2026-01-16',
        location: 'Gramado - RS',
        tags: 'comida, cafe, frio',
        bg: '#4f46e5',
        members: [memberLucas.id]
      }
    ];

    for (const photo of samplePhotos) {
      const fullPath = path.join(photosDir, photo.filename);
      const thumbPath = path.join(thumbnailsDir, photo.filename);
      
      createSampleSVGImage(fullPath, 1200, 800, photo.title, photo.location, photo.bg);
      createSampleSVGImage(thumbPath, 400, 300, photo.title, photo.location, photo.bg);

      const pRes = await runQuery(
        `INSERT INTO photos (filename, original_name, mime_type, size, width, height, filepath, thumbnail_path, title, description, event_id, nucleus_id, date, location, tags, uploaded_by)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          photo.filename,
          photo.filename,
          'image/svg+xml',
          10240,
          1200,
          800,
          `/uploads/photos/${photo.filename}`,
          `/uploads/thumbnails/${photo.filename}`,
          photo.title,
          photo.description,
          photo.event_id,
          photo.nucleus_id,
          photo.date,
          photo.location,
          photo.tags,
          adminResult.id
        ]
      );

      // Link members
      if (photo.members && photo.members.length > 0) {
        for (const mId of photo.members) {
          await runQuery(`INSERT INTO photo_members (photo_id, member_id) VALUES (?, ?)`, [pRes.id, mId]);
        }
      }
    }

    // Cover image setup for events and nuclei
    await runQuery(`UPDATE events SET cover_url = ? WHERE id = ?`, [`/uploads/thumbnails/foto_niver_70.svg`, eventNiverAdailton.id]);
    await runQuery(`UPDATE events SET cover_url = ? WHERE id = ?`, [`/uploads/thumbnails/foto_natal_arvore.svg`, eventNatal2025.id]);
    await runQuery(`UPDATE events SET cover_url = ? WHERE id = ?`, [`/uploads/thumbnails/foto_gramado_lago.svg`, eventViagemGramado.id]);

    await runQuery(`UPDATE family_nuclei SET cover_url = ? WHERE id = ?`, [`/uploads/thumbnails/foto_niver_70.svg`, nucleusRibeiro.id]);
    await runQuery(`UPDATE family_nuclei SET cover_url = ? WHERE id = ?`, [`/uploads/thumbnails/foto_gramado_lago.svg`, nucleusSilva.id]);

    // Default Banners
    const banner1Path = path.join(bannersDir, 'banner_bemvindo.svg');
    createSampleSVGImage(banner1Path, 1600, 500, 'Bem-vindo ao Acervo Digital da Família', 'Preserve memórias inesquecíveis com organização e segurança.', '#0f172a');
    
    await runQuery(
      `INSERT INTO banners (title, description, image_url, button_text, button_link, active, display_order)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        'Preserve Suas Memórias Mais Preciosas',
        'Organize fotos de festas, viagens e encontros familiares por núcleos, pessoas e datas especiais.',
        '/uploads/banners/banner_bemvindo.svg',
        'Explorar Galeria',
        '/galeria',
        1,
        1
      ]
    );

    // Default Albums
    const albumRes = await runQuery(
      `INSERT INTO albums (name, description, cover_url, created_by) VALUES (?, ?, ?, ?)`,
      ['Melhores Momentos de 2026', 'Seleção especial das fotografias mais marcantes do ano.', '/uploads/thumbnails/foto_niver_70.svg', adminResult.id]
    );

    // Add photos to album
    const allP = await getAll('SELECT id FROM photos');
    for (const p of allP) {
      await runQuery(`INSERT INTO album_photos (album_id, photo_id) VALUES (?, ?)`, [albumRes.id, p.id]);
    }

    // Default System Settings
    await runQuery(`INSERT OR REPLACE INTO system_settings (key, value) VALUES ('gallery_name', 'Galeria Digital da Família')`);
    await runQuery(`INSERT OR REPLACE INTO system_settings (key, value) VALUES ('allow_user_upload', 'true')`);

    console.log('Seeding concluído com sucesso!');
  }
};

export default db;
