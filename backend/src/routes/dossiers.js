const express = require('express');
const router = express.Router();
const { pool } = require('../db');
const auth = require('../middleware/auth');

// Liste des dossiers de l'utilisateur
router.get('/', auth, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM dossiers WHERE user_id = $1 ORDER BY updated_at DESC',
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Créer un dossier
router.post('/', auth, async (req, res) => {
  const { titre, description, nextcloud_path } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO dossiers (user_id, titre, description, nextcloud_path) VALUES ($1, $2, $3, $4) RETURNING *',
      [req.user.id, titre, description, nextcloud_path || null]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Supprimer un dossier
router.delete('/:id', auth, async (req, res) => {
  try {
    await pool.query(
      'DELETE FROM dossiers WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;