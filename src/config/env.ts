import { cleanEnv, str, port } from 'envalid';

export const env = cleanEnv(process.env, {
  DATABASE_URL: str(),
  PORT: port({ default: 3000 }),
  NODE_ENV: str({ choices: ['development', 'production', 'test'], default: 'development' }),
});
