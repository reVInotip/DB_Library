import { Entity, Column, PrimaryGeneratedColumn, OneToMany, ManyToMany } from 'typeorm';
import { RentedBook } from './rented_book';

@Entity()
export class Book {
  @PrimaryGeneratedColumn()
  bookId!: number;

  @Column({ length: 300 })
  title!: string;

  @Column({ length: 300 })
  author!: string;

  @Column('date')
  releaseDate!: Date;

  @Column('date')
  admissionDate!: Date;

  @Column('date', { nullable: true })
  lostDate?: Date;

  @Column('int')
  cost!: number;

  @Column('boolean')
  fromAnotherLib!: boolean;
}