const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables from .env if present
const envPath = path.resolve(__dirname, '../.env');
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
}

const schemaPath = path.resolve(__dirname, '../prisma/schema.prisma');
let schema = fs.readFileSync(schemaPath, 'utf8');

const dbUrl = process.env.DATABASE_URL || '';
const isPostgres = dbUrl.startsWith('postgres://') || dbUrl.startsWith('postgresql://') || process.env.RENDER === 'true';

const targetProvider = isPostgres ? 'postgresql' : 'sqlite';

console.log(`[PRISMA CONFIG] Target database provider: ${targetProvider}`);

const updatedSchema = schema.replace(
  /datasource\s+db\s+{\s*provider\s*=\s*"[^"]*"/,
  `datasource db {\n  provider = "${targetProvider}"`
);

if (schema !== updatedSchema) {
  fs.writeFileSync(schemaPath, updatedSchema, 'utf8');
  console.log(`[PRISMA CONFIG] Updated schema.prisma provider to "${targetProvider}".`);
} else {
  console.log(`[PRISMA CONFIG] schema.prisma already configured for "${targetProvider}".`);
}
