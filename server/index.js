import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { initDatabase } from './db.js';

import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import photoRoutes from './routes/photos.js';
import eventRoutes from './routes/events.js';
import nucleiRoutes from './routes/nuclei.js';
import memberRoutes from './routes/members.js';
import albumRoutes from './routes/albums.js';
import bannerRoutes from './routes/banners.js';
import statsRoutes from './routes/stats.js';
import settingsRoutes from './routes/settings.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve static upload files
const uploadsPath = path.join(__dirname, '..', 'uploads');
app.use('/uploads', express.static(uploadsPath));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/photos', photoRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/nuclei', nucleiRoutes);
app.use('/api/members', memberRoutes);
app.use('/api/albums', albumRoutes);
app.use('/api/banners', bannerRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/settings', settingsRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Servidor da Galeria Digital de Fotos está ativo.' });
});

// Serve production client build if exists
const distPath = path.join(__dirname, '..', 'dist');
app.use(express.static(distPath));

app.get('*', (req, res) => {
  if (!req.path.startsWith('/api') && !req.path.startsWith('/uploads')) {
    res.sendFile(path.join(distPath, 'index.html'), (err) => {
      if (err) {
        res.status(404).json({ message: 'Modo de desenvolvimento. Conecte no servidor Vite (porta 3000).' });
      }
    });
  }
});

// Start Server
const startServer = async () => {
  try {
    await initDatabase();
    app.listen(PORT, () => {
      console.log(`====================================================`);
      console.log(`🚀 SERVIDOR DA GALERIA DIGITAL ATIVO NA PORTA ${PORT}`);
      console.log(`📸 API disponível em: http://localhost:${PORT}/api/health`);
      console.log(`====================================================`);
    });
  } catch (error) {
    console.error('Erro ao iniciar servidor:', error);
  }
};

startServer();
