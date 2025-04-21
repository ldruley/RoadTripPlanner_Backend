import { VehiclesRepository } from './vehicles.repository';
import { DataSource } from 'typeorm';

describe('VehiclesRepository', () => {
  let repository: VehiclesRepository;
  let dataSource: jest.Mocked<DataSource>;

  beforeEach(() => {
    // Mock the DataSource
    dataSource = {
      createEntityManager: jest.fn().mockReturnValue({
        // Add any entity manager methods that might be used
      }),
    } as any;

    repository = new VehiclesRepository(dataSource);
  });

  it('should be defined', () => {
    expect(repository).toBeDefined();
  });
});
