import "reflect-metadata";
import express from 'express';
import cors from 'cors';
import morgan from "morgan";
import http from 'http';
import userRouter from "./routers/user.router";
import bookRouter from "./routers/books.router";
import readingPointsRouter from "./routers/reading_points.router";
import manager from "./model/session.manager";
import AppDataSource from "./model/data-source";

function onListening() {
    const addr = server.address();
    console.log('Listening on ', addr);
}

// init all database connections
//UserDataSource.initialize();
//ReadingPointDataSource.initialize();

(async () => {
    await AppDataSource.initialize();
    await manager.init();
})();

const app = express();
app.use(cors());

app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({extended: true}));

app.use('/user', userRouter);
app.use('/readingPoints', readingPointsRouter);
app.use('/books', bookRouter);

app.set('port', 8080);

const server = http.createServer(app);
server.on('listening', onListening);
server.listen(8080);