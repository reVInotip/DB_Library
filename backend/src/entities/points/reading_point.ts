import { Entity, JoinColumn, JoinTable, ManyToMany, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { PointType } from "./point_type";
import { Book } from "../books/book";
import { RentedBook } from "../books/rented_book";

@Entity()
export class ReadingPoint {
    @PrimaryGeneratedColumn()
    pointId!: number;

    @ManyToOne(() => PointType)
    @JoinColumn({ name: 'typeId' })
    type!: PointType;

    @ManyToMany(() => Book)
    @JoinTable()
    books: Book[];

    @OneToMany(() => RentedBook, rentedBook => rentedBook.book)
    rentedBooks?: RentedBook[];
}