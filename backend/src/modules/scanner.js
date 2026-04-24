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
        // Cherche par nom de fichier (résiste aux déplacements)
        const { rows } = await pool.query(
          'SELECT id, nextcloud_path FROM documents WHERE dossier_id = $1 AND nom = $2',
          [dossier.id, fichier.name]
        );

        if (rows.length === 0) {
          // Nouveau fichier
          await pool.query(
            'INSERT INTO documents (dossier_id, nom, nextcloud_path) VALUES ($1, $2, $3)',
            [dossier.id, fichier.name, fichier.href]
          );
          nouveaux.push({ dossier: dossier.titre, fichier: fichier.name });
        } else if (rows[0].nextcloud_path !== fichier.href) {
          // Fichier déplacé — on met à jour le chemin
          await pool.query(
            'UPDATE documents SET nextcloud_path = $1 WHERE id = $2',
            [fichier.href, rows[0].id]
          );
          console.log(`Fichier déplacé: ${fichier.name} → ${fichier.href}`);
        }
      }
    } catch (err) {
      console.error(`Scan erreur dossier ${dossier.titre}:`, err.message);
    }
  }

  return nouveaux;
};

module.exports = { scanDossiers };