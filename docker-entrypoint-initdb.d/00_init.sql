create extension pgcrypto;

-- users

create table roles (
    role_id serial primary key not null unique,
    role_name varchar(50) not null
);

create table faculties (
    faculty_id serial primary key not null unique,
    faculty_name varchar(50) not null
);

create table departments (
    department_id serial primary key not null unique,
    department_name varchar(50) not null
);

create table scientific_degrees (
    degree_id serial primary key not null unique,
    degree_name varchar(50) not null
);

create table titles (
    title_id serial primary key not null unique,
    title_name varchar(50) not null
);

create table categories (
    category_id serial primary key not null unique,
    category_name varchar(50) not null
);

create table student (
    faculty_id integer not null,
    foreign key (faculty_id) references faculties(faculty_id) on delete restrict,
    group_number integer not null
    course integer not null
) inherits (categories);

create table teacher (
    department_id integer not null,
    scientific_degree_id integer not null,
    title_id integer not null,
    foreign key (department_id) references departments(department_id) on delete restrict,
    foreign key (scientific_degree_id) references scientific_degrees(degree_id) on delete restrict,
    foreign key (title_id) references titles(title_id) on delete restrict
) inherits (categories);

create table users (
    user_id serial primary key not null unique,
    username varchar(50) not null,
    user_second_name varchar(50) not null,
    user_patronymic varchar(50),
    -- authorization info
    email varchar(255) not null unique,
        check (email ~* '^[a-zA-Z0-9.!#$%&''*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$'),
    password_hash text not null,
    salt text not null default gen_salt('bf', 8), -- blowfish с 8 раундами\

    role_id integer not null,
    category_id integer not null,
    foreign key (role_id) references roles(role_id) on delete restrict,
    foreign key (category_id) references categories(category_id) on delete restrict,
    banned_date date -- ?
);

-- books

create table books (
    book_id serial primary key not null unique,
    title varchar(300) not null,
    author varchar(300) not null,
    release_date date not null,
    admission_date date not null,
    lost_date date,
    cost integer not null check (cost > 0),
);

create table offences (
    id serial primary key not null unique,
    user_id integer not null,
    foreign key (user_id) references users(user_id) on delete restrict,
    description text not null,
    fine integer not null check (fine >= 0),
    lost_book integer not null,
    foreign key (lost_book) references books(book_id) on delete restrict
);

create table point_types (
    type_id serial primary key not null unique,
    type_name varchar(50) not null
);

create table reading_points (
    point_id serial primary key not null unique,
    type_id integer not null,
    address text not null,
    foreign key (type_id) references point_types(type_id) on delete restrict
);

create table statuses (
    status_id serial primary key not null unique,
    status_name varchar(50) not null
);

create table points_books (
    primary key (book_id, point_id),
    book_id integer not null,
    point_id integer not null,
    foreign key (book_id) references books(book_id) on delete restrict,
    foreign key (point_id) references reading_points(point_id) on delete restrict
);

create table rented_books (
    primary key (user_id, book_id, point_id),
    user_id integer not null,
    book_id integer not null,
    point_id integer not null,
    foreign key (user_id) references users(user_id) on delete restrict,
    foreign key (book_id) references books(book_id) on delete restrict,
    foreign key (point_id) references reading_points(point_id) on delete restrict,
    rented_date date not null,
    expired_date date not null,
    status_id integer not null,
    foreign key (status_id) references statuses(status_id) on delete restrict
);

create table orders (
    primary key book_id,
    book_id integer not null,
    foreign key (book_id) references books(book_id) on delete cascade,
    phone_number string not null,
    order_date date not null
);