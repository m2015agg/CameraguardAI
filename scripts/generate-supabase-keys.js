// scripts/generate-supabase-keys.js
// Usage: node scripts/generate-supabase-keys.js

const crypto = require('crypto');
const jwt = require('jsonwebtoken');

// Generate a secure JWT secret (40+ chars)
const JWT_SECRET = crypto.randomBytes(40).toString('base64');

// Generate ANON_KEY
const ANON_KEY = jwt.sign({ role: 'anon' }, JWT_SECRET, { algorithm: 'HS256' });

// Generate SERVICE_ROLE_KEY
const SERVICE_ROLE_KEY = jwt.sign({ role: 'service_role' }, JWT_SECRET, { algorithm: 'HS256' });

console.log(`JWT_SECRET=${JWT_SECRET}`);
console.log(`ANON_KEY=${ANON_KEY}`);
console.log(`SERVICE_ROLE_KEY=${SERVICE_ROLE_KEY}`); 