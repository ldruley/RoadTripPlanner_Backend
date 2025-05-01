import {
  EntityTarget,
  Repository,
  EntityManager,
  FindOptionsWhere,
  ObjectLiteral,
  DeepPartial,
} from 'typeorm';
import { NotFoundException } from '@nestjs/common';

export abstract class BaseService<T extends ObjectLiteral> {
  constructor(
    private readonly entity: EntityTarget<T>,
    private readonly repository: Repository<T>,
  ) {}

  protected getRepo(manager?: EntityManager): Repository<T> {
    return manager ? manager.getRepository(this.entity) : this.repository;
  }
  async create(createDto: DeepPartial<T>, manager?: EntityManager): Promise<T> {
    const repo = this.getRepo(manager);
    const entity = repo.create(createDto);
    return repo.save(entity);
  }

  async findOneOrThrow(
    where: FindOptionsWhere<T>,
    manager?: EntityManager,
  ): Promise<T> {
    const repo = this.getRepo(manager);
    const entity = await repo.findOne({ where });
    if (!entity) {
      throw new NotFoundException(`Resource not found`);
    }
    return entity;
  }

  async findOneOrNull(
    where: FindOptionsWhere<T>,
    manager?: EntityManager,
  ): Promise<T | null> {
    const repo = this.getRepo(manager);
    return await repo.findOne({ where });
  }

  async findAll(
    where?: FindOptionsWhere<T>,
    manager?: EntityManager,
  ): Promise<T[]> {
    const repo = this.getRepo(manager);
    return repo.find({ where });
  }

  async exists(
    where: FindOptionsWhere<T>,
    manager?: EntityManager,
  ): Promise<boolean> {
    const repo = this.getRepo(manager);
    const count = await repo.count({ where });
    return count > 0;
  }

  async save(entity: T, manager?: EntityManager): Promise<T> {
    const repo = this.getRepo(manager);
    return repo.save(entity);
  }

  async delete(
    where: FindOptionsWhere<T>,
    manager?: EntityManager,
  ): Promise<void> {
    const repo = this.getRepo(manager);
    await repo.delete(where);
  }

  async withTransaction<R>(
    fn: (manager: EntityManager) => Promise<R>,
  ): Promise<R> {
    return this.repository.manager.transaction(fn);
  }
}
