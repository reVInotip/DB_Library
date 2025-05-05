import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { Teacher } from "./teacher";

@Entity()
export class Title {
    @PrimaryGeneratedColumn()
    titleId!: number;

    @Column({ length: 50 })
    titleName!: string;

    @OneToMany(() => Teacher, teacher => teacher.title)
    teachers!: Teacher[];
}