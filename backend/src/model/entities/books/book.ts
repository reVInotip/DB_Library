import { Entity, Column, PrimaryGeneratedColumn, OneToMany, ManyToMany, ManyToOne, JoinColumn } from 'typeorm';
import { RentedBook } from './rented_book';
import { ReadingPoint } from '../points/reading_point';

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

    @ManyToOne(() => ReadingPoint, point => point.books)
    @JoinColumn({ name: 'pointId' })
    point!: ReadingPoint;
}