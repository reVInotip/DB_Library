import { Column, Entity, JoinColumn, JoinTable, ManyToMany, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { PointType } from "./point_type";
import { Book } from "../books/book";
import { RentedBook } from "../books/rented_book";
import { PointUser } from "./point_user";

@Entity()
export class ReadingPoint {
    @PrimaryGeneratedColumn()
    pointId!: number;

    @ManyToOne(() => PointType, type => type.readingPoints)
    @JoinColumn({ name: 'typeId' })
    type!: PointType;

    @Column()
    address: string;

    @ManyToMany(() => Book)
    @JoinTable()
    books: Book[];

    @OneToMany(() => RentedBook, rentedBook => rentedBook.book, { nullable: true })
    rentedBooks?: RentedBook[];

    @OneToMany(() => PointUser, point => point.user, { nullable: true })
    users?: PointUser[];
}