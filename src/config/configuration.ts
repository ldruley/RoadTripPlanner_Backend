import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
    nodeEnv: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT, 10) || 3000,
    apiPrefix: process.env.API_PREFIX || 'api',
    jwtSecret: process.env.JWT_SECRET || 'super-secret-jwt',
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1d',
    apiKey: process.env.API_KEY || 'map-api-key-here',
}));