import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from "typeorm";
import { User } from "../user/user";
import { ReadingPoint } from "./reading_point";

@Entity()
export class PointUser {
    @PrimaryColumn()
    userId!: number;

    @PrimaryColumn()
    pointId!: number;

    @ManyToOne(() => User, user => user.points)
    @JoinColumn({ name: 'userId' })
    user!: User;

    @ManyToOne(() => ReadingPoint, point => point.users)
    @JoinColumn({ name: 'pointId' })
    readingPoint!: ReadingPoint;

    @Column({ type: 'date' })
    registerDate!: Date;

    @Column({ type: 'date', nullable: true })
    eleminationDate: Date;
}