import { VehiclesRepository } from './vehicles.repository';

describe('VehiclesRepository', () => {
  it('should be defined', () => {
    expect(new VehiclesRepository()).toBeDefined();
  });
});
