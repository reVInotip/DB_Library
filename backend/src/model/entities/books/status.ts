import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { RentedBook } from "./rented_book";

@Entity()
export class Status {
    @PrimaryGeneratedColumn()
    statusId!: number

    @Column({ length: 50 })
    statusName!: string;

    @OneToMany(() => RentedBook, rentedBook => rentedBook.status)
    rentedBooks?: RentedBook[];
}