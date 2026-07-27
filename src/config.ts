export const config = {
  useSqlite: process.env.USE_SQLITE === 'true',
  db: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_DATABASE || 'gamesphere',
  },
  jwtSecret: process.env.JWT_SECRET || 'dev-secret-change-in-production',
  googleClientId: process.env.GOOGLE_CLIENT_ID || '',
  initialSuperadminEmail: process.env.INITIAL_SUPERADMIN_EMAIL,
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  port: process.env.PORT || 3000,
};
