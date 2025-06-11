import { Column, Entity, JoinColumn, OneToOne, PrimaryColumn } from "typeorm";
import { Book } from "./book";

@Entity()
export class Orders {
    @PrimaryColumn()
    bookId!: number;

    @OneToOne(() => Book, book => book.bookId)
    @JoinColumn({ name: 'bookId' })
    book!: Book;

    @Column()
    phoneNumber!: string;

    @Column()
    orderDate!: Date;
}