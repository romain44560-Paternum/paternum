require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { testDB } = require('./db');
const { testRedis } = require('./redis');
const authRoutes = require('./routes/auth');
const dossiersRoutes = require('./routes/dossiers');
const documentsRoutes = require('./routes/documents');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/dossiers', dossiersRoutes);
app.use('/api/documents', documentsRoutes);

// Route de santé
app.get('/api/health', async (req, res) => {
  const db = await testDB();
  const redis = await testRedis();
  res.json({
    status: 'ok',
    postgres: db ? 'connected' : 'error',
    redis: redis ? 'connected' : 'error'
  });
});

app.listen(PORT, () => {
  console.log(`Paternum backend démarré sur le port ${PORT}`);
});