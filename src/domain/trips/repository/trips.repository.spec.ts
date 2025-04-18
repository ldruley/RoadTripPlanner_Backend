import { TripsRepository } from './trips.repository';

describe('TripsRepository', () => {
  it('should be defined', () => {
    expect(new TripsRepository()).toBeDefined();
  });
});
