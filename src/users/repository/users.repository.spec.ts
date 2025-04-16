import { UsersRepository } from './users.repository';

describe('UsersRepository', () => {
  it('should be defined', () => {
    expect(new UsersRepository()).toBeDefined();
  });
});
