import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { Teacher } from "./teacher";

@Entity()
export class Department {
    @PrimaryGeneratedColumn()
    departmentId!: number;

    @Column({ length: 50 })
    departmentName!: string;

    @OneToMany(() => Teacher, teacher => teacher.department)
    teachers!: Teacher[];
}