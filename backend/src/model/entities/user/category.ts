import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { User } from './user';

@Entity()
export class Category {
  @PrimaryGeneratedColumn()
  categoryId!: number;

  @Column({ length: 50 })
  categoryName!: string;

  @OneToMany(() => User, user => user.category)
  users!: User[];
}