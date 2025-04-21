import { StintsRepository } from './stints.repository';
import { DataSource } from 'typeorm';

describe('StintsRepository', () => {
  let repository: StintsRepository;
  let dataSource: jest.Mocked<DataSource>;

  beforeEach(() => {
    // Mock the DataSource
    dataSource = {
      createEntityManager: jest.fn().mockReturnValue({
        // Add any entity manager methods that might be used
      }),
    } as any;

    repository = new StintsRepository(dataSource);
  });

  it('should be defined', () => {
    expect(repository).toBeDefined();
  });
});
