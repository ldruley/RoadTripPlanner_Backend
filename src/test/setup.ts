import { DataSource } from 'typeorm';

export const createMockDataSource = () => {
  return {
    createEntityManager: jest.fn().mockReturnValue({
      // Add common entity manager methods here
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      remove: jest.fn(),
      create: jest.fn(),
    }),
    getRepository: jest.fn().mockReturnValue({
      // Add common repository methods here
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      remove: jest.fn(),
      create: jest.fn(),
      createQueryBuilder: jest.fn(),
    }),
    transaction: jest.fn(),
  } as unknown as jest.Mocked<DataSource>;
};

// Mock configuration for ConfigService
export const createMockConfigService = () => {
  return {
    get: jest.fn((key: string) => {
      const config = {
        'app.jwtSecret': 'test-secret',
        'app.jwtExpiresIn': '1d',
        'app.hereApiKey': 'test-api-key',
      };
      return config[key] || '';
    }),
  };
};

// For global test setup
import 'reflect-metadata';

// Mock bcrypt globally
jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('hashedPassword'),
  compare: jest.fn().mockResolvedValue(true),
}));

// Mock axios globally
jest.mock('axios', () => ({
  get: jest.fn().mockResolvedValue({ data: {} }),
  post: jest.fn().mockResolvedValue({ data: {} }),
}));
