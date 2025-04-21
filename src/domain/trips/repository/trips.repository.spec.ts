import { TripsRepository } from './trips.repository';
import { DataSource } from 'typeorm';

describe('TripsRepository', () => {
  let repository: TripsRepository;
  let dataSource: jest.Mocked<DataSource>;

  beforeEach(() => {
    // Mock the DataSource
    dataSource = {
      createEntityManager: jest.fn().mockReturnValue({
        // Add any entity manager methods that might be used
      }),
    } as any;

    repository = new TripsRepository(dataSource);
  });

  it('should be defined', () => {
    expect(repository).toBeDefined();
  });
});
