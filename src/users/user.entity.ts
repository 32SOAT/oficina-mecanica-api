import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { Exclude } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

@Entity('usuario')
export class UserEntity {
  @ApiProperty({ format: 'uuid', example: '550e8400-e29b-41d4-a716-446655440000' })
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
}
