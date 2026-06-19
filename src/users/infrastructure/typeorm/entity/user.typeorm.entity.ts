import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { Exclude } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { User } from '../../../domain/user';

@Entity('usuario')
export class UserTypeormEntity {
  @ApiProperty({
    format: 'uuid',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ example: 'admin' })
  @Column()
  username: string;

  @ApiProperty({ example: 'admin@oficina.local' })
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
