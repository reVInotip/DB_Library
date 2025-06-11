import "reflect-metadata"
import { DataSource } from 'typeorm';
import { User } from "./entities/user/user";
import { Book } from "./entities/books/book";
import { RentedBook } from "./entities/books/rented_book";
import { Title } from "./entities/user/title";
import { Teacher } from "./entities/user/teacher";
import { Student } from "./entities/user/student";
import { ScientificDegree } from "./entities/user/scientific_degree";
import { Role } from "./entities/user/role";
import { Faculty } from "./entities/user/faculty";
import { Department } from "./entities/user/department";
import { Category } from "./entities/user/category";
import { Status } from "./entities/books/status";
import { PointType } from "./entities/points/point_type";
import { PointUser } from "./entities/points/point_user";
import { ReadingPoint } from "./entities/points/reading_point";
import { Orders } from "./entities/books/orders";

const AppDataSource = new DataSource({
    type: "postgres",
    host: process.env.HOST || "postgres",
    port: process.env.PORT_DB ? Number(process.env.PORT_DB) : 5432,
    username: process.env.USERNAME,
    password: process.env.PASSWORD,
    database: process.env.DATABASE,
    migrations: ["src/migration/*.{js,ts}"],
    synchronize: true,
    logging: true,
    entities: [
        User, Title, Teacher, Student, ScientificDegree, Role, Faculty, Department, Category, Book, RentedBook, Status, Orders, PointType, PointUser, ReadingPoint
    ]
});

export default AppDataSource;

/* export const BookDataSource = new DataSource({
    type: "postgres",
    host: process.env.HOST || "postgres",
    port: process.env.PORT_DB ? Number(process.env.PORT_DB) : 5432,
    username: process.env.USERNAME,
    password: process.env.PASSWORD,
    database: process.env.DATABASE,
    migrations: ["src/migration/*.{js,ts}"],
    synchronize: false,
    logging: true,
    entities: [
        Book, RentedBook, Status, Orders
    ]
})

export const ReadingPointDataSource = new DataSource({
    type: "postgres",
    host: process.env.HOST || "postgres",
    port: process.env.PORT_DB ? Number(process.env.PORT_DB) : 5432,
    username: process.env.USERNAME,
    password: process.env.PASSWORD,
    database: process.env.DATABASE,
    migrations: ["src/migration/*.{js,ts}"],
    synchronize: false,
    logging: true,
    entities: [
        PointType, PointUser, ReadingPoint
    ]
}) */