const { createClient } = require('redis');

const client = createClient({ url: process.env.REDIS_URL });

client.on('error', err => console.error('Redis erreur:', err.message));

const connectRedis = async () => {
  await client.connect();
  console.log('Redis connecté');
};

const testRedis = async () => {
  try {
    await client.ping();
    return true;
  } catch (err) {
    console.error('Redis ping erreur:', err.message);
    return false;
  }
};

connectRedis();

module.exports = { client, testRedis };
