import { UsersRepository } from './users.repository';
import { DataSource } from 'typeorm';

describe('UsersRepository', () => {
  let repository: UsersRepository;
  let dataSource: jest.Mocked<DataSource>;

  beforeEach(() => {
    // Mock the DataSource
    dataSource = {
      createEntityManager: jest.fn().mockReturnValue({
        // Add any entity manager methods that might be used
      }),
    } as any;

    repository = new UsersRepository(dataSource);
  });

  it('should be defined', () => {
    expect(repository).toBeDefined();
  });
});
