import { LegsRepository } from './legs.repository';
import { DataSource } from 'typeorm';

describe('LegsRepository', () => {
  let repository: LegsRepository;
  let dataSource: jest.Mocked<DataSource>;

  beforeEach(() => {
    // Mock the DataSource
    dataSource = {
      createEntityManager: jest.fn().mockReturnValue({
        // Add any entity manager methods that might be used
      }),
    } as any;

    repository = new LegsRepository(dataSource);
  });

  it('should be defined', () => {
    expect(repository).toBeDefined();
  });
});
