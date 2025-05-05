import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { ReadingPoint } from "./reading_point";

@Entity()
export class PointType {
    @PrimaryGeneratedColumn()
    typeId!: number;

    @Column({ length: 50 })
    typeName!: string

    @OneToMany(() => ReadingPoint, readingPoint => readingPoint.type)
    readingPoints!: ReadingPoint[]
}