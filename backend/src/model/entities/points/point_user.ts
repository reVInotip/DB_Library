import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from "typeorm";
import { User } from "../user/user";
import { ReadingPoint } from "./reading_point";

@Entity()
export class PointUser {
    @PrimaryColumn()
    @ManyToOne(() => User)
    @JoinColumn({ name: 'userId' })
    userId!: User;

    @PrimaryColumn()
    @ManyToOne(() => ReadingPoint)
    @JoinColumn({ name: 'pointId' })
    readingPoint!: ReadingPoint;

    @Column({ type: 'date' })
    registerDate!: Date;

    @Column({ type: 'date', nullable: true })
    eleminationDate: Date;
}