import 'dotenv/config';
import { defineConfig, env } from 'prisma/config';

export default defineConfig({
  // 1. Specifies the location of your schema file
  schema: 'prisma/schema.prisma',
  
  // 2. Defines the database connection URL for CLI tools
  datasource: {
    url: env('DATABASE_URL'),
  },

// 3. (Optional but recommended) Ensure migrations path is defined
migrations: {
  path: 'prisma/migrations',
},
});