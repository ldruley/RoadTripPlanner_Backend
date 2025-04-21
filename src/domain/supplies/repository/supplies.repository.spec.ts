import { SuppliesRepository } from './supplies.repository';
import { DataSource } from 'typeorm';

describe('SuppliesRepository', () => {
  let repository: SuppliesRepository;
  let dataSource: jest.Mocked<DataSource>;

  beforeEach(() => {
    // Mock the DataSource
    dataSource = {
      createEntityManager: jest.fn().mockReturnValue({
        // Add any entity manager methods that might be used
      }),
    } as any;

    repository = new SuppliesRepository(dataSource);
  });

  it('should be defined', () => {
    expect(repository).toBeDefined();
  });
});
