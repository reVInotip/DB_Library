import { Column, Entity, JoinColumn, ManyToOne, OneToOne, PrimaryColumn } from "typeorm";
import { User } from "../user/user";
import { Book } from "./book";
import { ReadingPoint } from "../points/reading_point";
import { Status } from "./status";

@Entity()
export class RentedBook {
    @PrimaryColumn()
    userId!: number;

    @PrimaryColumn()
    bookId!: number;

    @PrimaryColumn()
    pointId!: number;

    @ManyToOne(() => User, user => user.rentedBooks)
    @JoinColumn({ name: 'userId' })
    user!: User;

    @OneToOne(() => Book, book => book.bookId)
    @JoinColumn({ name: 'bookId' })
    book!: Book;
    
    @ManyToOne(() => ReadingPoint, point => point.rentedBooks)
    @JoinColumn({ name: 'pointId' })
    point!: ReadingPoint;

    @Column({ type: 'date', nullable: true })
    rentedDate!: Date;

    @Column({ type: 'date', nullable: true })
    expiredDate!: Date;

    @ManyToOne(() => Status, status => status.rentedBooks)
    @JoinColumn({ name: 'statusId' })
    status!: Status;
}