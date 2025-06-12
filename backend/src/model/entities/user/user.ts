import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, ChildEntity, OneToMany, TableInheritance, PrimaryColumn } from 'typeorm';
import { Role } from './role';
import { Category } from './category';
import { RentedBook } from '../books/rented_book';
import { ReadingPoint } from '../points/reading_point';
import { PointUser } from '../points/point_user';
import { Orders } from '../books/orders';

@Entity()
@TableInheritance({ column: { type: 'varchar', name: 'type' } })
export class User {
  @PrimaryGeneratedColumn()
  userId!: number;

  @Column({ length: 50 })
  username!: string;

  @Column({ length: 50 })
  userSecondName!: string;

  @Column({ length: 50, nullable: true })
  userPatronymic?: string;

  @PrimaryColumn()
  @Column({ length: 255, unique: true })
  email!: string;

  @Column('text')
  passwordHash!: string;

  @ManyToOne(() => Role, role => role.users)
  @JoinColumn({ name: 'roleId' })
  role!: Role;

  /*@ManyToOne(() => Category)
  @JoinColumn({ name: 'categoryId' })
  category!: Category;*/

  @Column({ type: 'date', nullable: true })
  bannedDate?: Date;

  @OneToMany(() => RentedBook, rentedBook => rentedBook.book)
  rentedBooks?: RentedBook[];

  @OneToMany(() => PointUser, point => point.user)
  points?: PointUser[];

  @OneToMany(() => Orders, order => order.user)
  orders?: Orders[];
}