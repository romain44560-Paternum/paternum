const express = require('express');
const router = express.Router();
const { pool } = require('../db');
const auth = require('../middleware/auth');

// Liste des documents d'un dossier
router.get('/:dossierId', auth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT d.*, f.contenu as fiche_ia
       FROM documents d
       LEFT JOIN fiches_ia f ON f.document_id = d.id
       WHERE d.dossier_id = $1
       ORDER BY d.created_at ASC`,
      [req.params.dossierId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;