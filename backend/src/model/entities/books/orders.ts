import { Column, Entity, JoinColumn, OneToOne, PrimaryColumn } from "typeorm";
import { Book } from "./book";

@Entity()
export class Orders {
    @PrimaryColumn()
    @OneToOne(() => Book)
    @JoinColumn({ name: 'bookId' })
    book!: number;

    @Column()
    phoneNumber!: string;

    @Column()
    orderDate!: Date;
}