import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { User } from './user';

@Entity()
export class Role {
  @PrimaryGeneratedColumn()
  roleId!: number;

  @Column({ length: 50 })
  roleName!: string;

  @OneToMany(() => User, user => user.role)
  users!: User[];
}