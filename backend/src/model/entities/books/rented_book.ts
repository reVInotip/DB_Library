import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from "typeorm";
import { User } from "../user/user";
import { Book } from "./book";
import { ReadingPoint } from "../points/reading_point";
import { Status } from "./status";

@Entity()
export class RentedBook {
    @PrimaryColumn()
    @ManyToOne(() => User)
    @JoinColumn({ name: 'userId' })
    user!: number;

    @PrimaryColumn()
    @ManyToOne(() => Book)
    @JoinColumn({ name: 'bookId' })
    book!: number;

    @PrimaryColumn()
    @ManyToOne(() => ReadingPoint)
    @JoinColumn({ name: 'pointId' })
    point!: number;

    @Column({ type: 'date', nullable: true })
    rentedDate!: Date;

    @Column({ type: 'date', nullable: true })
    expiredDate!: Date;

    @ManyToOne(() => Status)
    @JoinColumn({ name: 'statusId' })
    status!: Status;
}