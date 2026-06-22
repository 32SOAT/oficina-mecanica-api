import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { Exclude } from 'class-transformer';
import { User } from '../../../domain/user';

@Entity('usuario')
export class UserTypeormEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;
  @Column()
  username: string;
  @Column({ unique: true, nullable: false })
  email: string;

  @Exclude()
  @Column({ select: false })
  password: string;

  static fromDomain(user: User): UserTypeormEntity {
    const entity = new UserTypeormEntity();
    if (user.id) {
      entity.id = user.id;
    }
    entity.username = user.username;
    entity.email = user.email;
    if (user.password !== undefined) {
      entity.password = user.password;
    }
    return entity;
  }

  toDomain(): User {
    return new User({
      id: this.id,
      username: this.username,
      email: this.email,
    });
  }
}

/** @deprecated Use UserTypeormEntity */
export { UserTypeormEntity as UserEntity };
