const fs = require('fs');

if (fs.existsSync('env_config.b64')) {
  const b64 = fs.readFileSync('env_config.b64', 'utf8').trim();
  fs.writeFileSync('.env', Buffer.from(b64, 'base64').toString('utf8'));
  console.log('✅ .env created successfully from env_config.b64');
} else {
  console.log('⚠️ env_config.b64 not found.');
}
