import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class Status {
    @PrimaryGeneratedColumn()
    statusId!: number

    @Column({ length: 50 })
    departmentName!: string;
}