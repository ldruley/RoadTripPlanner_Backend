import { Repository } from 'typeorm';

declare global {
  namespace jest {
    interface Matchers<R> {
      // Add any custom matchers here if needed
    }
  }
}

export type MockRepository<T = any> = Partial<
  Record<keyof Repository<T>, jest.Mock>
>;

export type MockedRepository<T extends object> = {
  [P in keyof T]: T[P] extends (...args: any[]) => any ? jest.Mock : T[P];
};
