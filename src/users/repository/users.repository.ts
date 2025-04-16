import { DataSource, Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { Injectable } from '@nestjs/common';

@Injectable()
export class UsersRepository extends Repository<User> {
    constructor(private dataSource: DataSource) {
        super(User, dataSource.createEntityManager());
    }

    findByUsername(username: string): Promise<User | null> {
        return this.findOne({ where: { username } });
    }

    findByEmail(email: string): Promise<User | null> {
        return this.findOne({ where: { email } });
    }
}
