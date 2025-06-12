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

    @OneToMany(() => Book, book => book.point, { nullable: true })
    books?: Book[];

    @OneToMany(() => RentedBook, rentedBook => rentedBook.point, { nullable: true })
    rentedBooks?: RentedBook[];

    @OneToMany(() => PointUser, point => point.readingPoint, { nullable: true })
    users?: PointUser[];
}