const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { pool } = require('../db');
const { client: redis } = require('../redis');
const { scanDossiers } = require('../modules/scanner');

const {
  NEXTCLOUD_URL,
  NEXTCLOUD_CLIENT_ID,
  NEXTCLOUD_CLIENT_SECRET,
  NEXTCLOUD_REDIRECT_URI,
  JWT_SECRET
} = process.env;

// Étape 1 — Redirige vers Nextcloud pour login
router.get('/login', (req, res) => {
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: NEXTCLOUD_CLIENT_ID,
    redirect_uri: NEXTCLOUD_REDIRECT_URI,
  });
  res.redirect(`${NEXTCLOUD_URL}/index.php/apps/oauth2/authorize?${params}`);
});

// Étape 2 — Nextcloud redirige ici avec un code
router.get('/callback', async (req, res) => {
  const { code } = req.query;
  if (!code) return res.status(400).json({ error: 'Code manquant' });

  try {
    // Échange le code contre un token Nextcloud
    const tokenRes = await fetch(`${NEXTCLOUD_URL}/index.php/apps/oauth2/api/v1/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: NEXTCLOUD_REDIRECT_URI,
        client_id: NEXTCLOUD_CLIENT_ID,
        client_secret: NEXTCLOUD_CLIENT_SECRET,
      }),
    });

    const tokenData = await tokenRes.json();
    console.log('Token response:', JSON.stringify(tokenData));
    if (!tokenData.access_token) throw new Error('Token invalide');

    // Récupère les infos utilisateur Nextcloud
    const userRes = await fetch(`${NEXTCLOUD_URL}/ocs/v2.php/cloud/user?format=json`, {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
        'OCS-APIRequest': 'true',
      },
    });

    const userData = await userRes.json();
    console.log('User response:', JSON.stringify(userData));
    const nc = userData.ocs.data;

    // Crée ou met à jour l'utilisateur en base
    const result = await pool.query(
      `INSERT INTO users (nextcloud_id, display_name, email)
       VALUES ($1, $2, $3)
       ON CONFLICT (nextcloud_id) DO UPDATE
       SET display_name = $2, email = $3
       RETURNING *`,
      [nc.id, nc.displayname, nc.email]
    );

    const user = result.rows[0];

    // Stocke le token Nextcloud dans Redis (expire avec le token)
    await redis.set(`nc_token:${user.id}`, tokenData.access_token, { EX: 3600 });

    // Scan des nouveaux fichiers en arrière-plan
    scanDossiers(user.id, tokenData.access_token).then(nouveaux => {
      if (nouveaux.length > 0) console.log(`Nouveaux fichiers détectés:`, nouveaux);
    }).catch(err => console.error('Scan erreur:', err.message));

    // Génère un JWT Paternum
    const token = jwt.sign(
      { id: user.id, nextcloud_id: user.nextcloud_id, display_name: user.display_name },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Redirige vers le frontend avec le token
    res.redirect(`/?token=${token}`);

  } catch (err) {
    console.error('Auth erreur:', err.message);
    res.status(500).json({ error: 'Erreur authentification' });
  }
});

module.exports = router;