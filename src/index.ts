import * as dotenv from 'dotenv';
dotenv.config();
import app from './app';
import { ensureAdmin } from './bootstrap/ensureAdmin';

const port = process.env.PORT || 3001;

(async () => {
  await ensureAdmin();
  app.listen(port, () => {
  console.log(`Server started on port ${port}`);
});
})();