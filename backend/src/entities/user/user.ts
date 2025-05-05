import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, ChildEntity, OneToMany } from 'typeorm';
import { Role } from './role';
import { Category } from './category';
import { RentedBook } from '../books/rented_book';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  userId!: number;

  @Column({ length: 50 })
  username!: string;

  @Column({ length: 50 })
  userSecondName!: string;

  @Column({ length: 50, nullable: true })
  userPatronymic?: string;

  @Column({ length: 255, unique: true })
  email!: string;

  @Column('text')
  passwordHash!: string;

  @Column('text')
  salt!: string;

  @ManyToOne(() => Role)
  @JoinColumn({ name: 'roleId' })
  role!: Role;

  @ManyToOne(() => Category)
  @JoinColumn({ name: 'categoryId' })
  category!: Category;

  @Column({ type: 'date', nullable: true })
  bannedDate?: Date;

  @OneToMany(() => RentedBook, rentedBook => rentedBook.book)
  rentedBooks?: RentedBook[];
}