import { StopsRepository } from '../stops/stops.repository';

describe('StopsRepository', () => {
  it('should be defined', () => {
    expect(new StopsRepository()).toBeDefined();
  });
});
