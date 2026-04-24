const { pool } = require('../db');
const { listFiles } = require('./webdav');

// Scanne les dossiers liés à Nextcloud et détecte les nouveaux fichiers
const scanDossiers = async (userId, ncToken) => {
  // Récupère tous les dossiers liés à un chemin Nextcloud
  const { rows: dossiers } = await pool.query(
    `SELECT d.*, u.nextcloud_id FROM dossiers d
     JOIN users u ON u.id = d.user_id
     WHERE d.user_id = $1 AND d.nextcloud_path IS NOT NULL`,
    [userId]
  );

  const nouveaux = [];

  for (const dossier of dossiers) {
    try {
      // Liste les fichiers dans Nextcloud
      console.log(`Scan dossier "${dossier.titre}" → path: ${dossier.nextcloud_path} | user: ${dossier.nextcloud_id}`);
      const fichiers = await listFiles(ncToken, dossier.nextcloud_path, dossier.nextcloud_id);
      console.log(`Fichiers trouvés: ${fichiers.length}`);

      for (const fichier of fichiers) {
        // Vérifie si le fichier est déjà en base
        const { rows } = await pool.query(
          'SELECT id FROM documents WHERE dossier_id = $1 AND nextcloud_path = $2',
          [dossier.id, fichier.href]
        );

        if (rows.length === 0) {
          // Nouveau fichier — on l'ajoute en base
          await pool.query(
            `INSERT INTO documents (dossier_id, nom, nextcloud_path)
             VALUES ($1, $2, $3)`,
            [dossier.id, fichier.name, fichier.href]
          );
          nouveaux.push({ dossier: dossier.titre, fichier: fichier.name });
        }
      }
    } catch (err) {
      console.error(`Scan erreur dossier ${dossier.titre}:`, err.message);
    }
  }

  return nouveaux;
};

module.exports = { scanDossiers };