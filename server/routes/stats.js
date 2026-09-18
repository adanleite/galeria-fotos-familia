import express from 'express';
import { getAll, getRow } from '../db.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();
router.use(verifyToken);

// GET /api/stats
router.get('/', async (req, res) => {
  try {
    const photoCountRow = await getRow(`SELECT COUNT(*) as count FROM photos`);
    const eventCountRow = await getRow(`SELECT COUNT(*) as count FROM events`);
    const nucleusCountRow = await getRow(`SELECT COUNT(*) as count FROM family_nuclei`);
    const memberCountRow = await getRow(`SELECT COUNT(*) as count FROM family_members`);
    const albumCountRow = await getRow(`SELECT COUNT(*) as count FROM albums`);

    const recentPhotos = await getAll(`
      SELECT p.*, e.name as event_name, n.name as nucleus_name
      FROM photos p
      LEFT JOIN events e ON p.event_id = e.id
      LEFT JOIN family_nuclei n ON p.nucleus_id = n.id
      ORDER BY p.created_at DESC
      LIMIT 8
    `);

    const recentEvents = await getAll(`
      SELECT e.*, c.name as category_name, n.name as nucleus_name,
        (SELECT COUNT(*) FROM photos p WHERE p.event_id = e.id) as photo_count
      FROM events e
      LEFT JOIN event_categories c ON e.category_id = c.id
      LEFT JOIN family_nuclei n ON e.nucleus_id = n.id
      ORDER BY e.created_at DESC
      LIMIT 4
    `);

    return res.json({
      stats: {
        totalPhotos: photoCountRow?.count || 0,
        totalEvents: eventCountRow?.count || 0,
        totalNuclei: nucleusCountRow?.count || 0,
        totalMembers: memberCountRow?.count || 0,
        totalAlbums: albumCountRow?.count || 0,
      },
      recentPhotos,
      recentEvents,
    });
  } catch (error) {
    return res.status(500).json({ message: 'Erro ao carregar estatísticas.' });
  }
});

export default router;
