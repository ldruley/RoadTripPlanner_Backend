import { registerAs } from '@nestjs/config';

export default registerAs('database', () => {
  // Parse DATABASE_URL for Heroku if available
  if (process.env.DATABASE_URL) {
    // Parse the DATABASE_URL for Heroku
    const databaseUrl = new URL(process.env.DATABASE_URL);
    return {
      type: 'postgres',
      host: databaseUrl.hostname,
      port: parseInt(databaseUrl.port, 10) || 5432,
      username: databaseUrl.username,
      password: databaseUrl.password,
      database: databaseUrl.pathname.substring(1), // Remove leading slash
      ssl: {
        rejectUnauthorized: false, // Required for Heroku PostgreSQL
      },
      entities: ['dist/**/*.entity{.ts,.js}'],
      synchronize: true, // For development mode, set to true
      autoLoadEntities: true,
      logging: process.env.NODE_ENV === 'development',
    };
  }

  // Local development with Docker
  else if (
    process.env.NODE_ENV === 'development' &&
    process.env.DATABASE_HOST === 'postgres'
  ) {
    return {
      type: 'postgres',
      host: 'postgres',
      port: process.env.DATABASE_PORT
        ? parseInt(process.env.DATABASE_PORT, 10)
        : 5432,
      username: process.env.DATABASE_USERNAME || 'postgres',
      password: process.env.DATABASE_PASSWORD || 'postgres',
      database: process.env.DATABASE_NAME || 'roadtripplanner',
      entities: ['dist/**/*.entity{.ts,.js}'],
      synchronize: true,
      autoLoadEntities: true,
      logging: true,
    };
  }

  // Other environments (local without Docker)
  else {
    return {
      type: 'postgres',
      host: process.env.DATABASE_HOST || 'localhost',
      port: process.env.DATABASE_PORT
        ? parseInt(process.env.DATABASE_PORT, 10)
        : 5432,
      username: process.env.DATABASE_USERNAME || 'postgres',
      password: process.env.DATABASE_PASSWORD || 'postgres',
      database: process.env.DATABASE_NAME || 'roadtripplanner',
      ssl:
        process.env.DATABASE_SSL === 'true'
          ? {
              rejectUnauthorized: false,
            }
          : false,
      entities: ['dist/**/*.entity{.ts,.js}'],
      synchronize: true, // For development mode, set to true
      autoLoadEntities: true,
      logging: process.env.NODE_ENV === 'development',
    };
  }
});
