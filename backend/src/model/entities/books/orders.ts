import { Column, Entity, JoinColumn, ManyToOne, OneToOne, PrimaryColumn } from "typeorm";
import { Book } from "./book";
import { User } from "../user/user";

@Entity()
export class Orders {
    @PrimaryColumn()
    bookId!: number;

    @PrimaryColumn()
    userId!: number;

    @OneToOne(() => Book, book => book.bookId)
    @JoinColumn({ name: 'bookId' })
    book!: Book;

    @ManyToOne(() => User, user => user.orders)
    @JoinColumn({ name: 'userId' })
    user!: User;

    @Column()
    phoneNumber!: string;

    @Column()
    orderDate!: Date;
}