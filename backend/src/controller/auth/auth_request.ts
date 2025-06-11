import { AuthorizedSession, ISession } from "../../model/session/session.interface";
import { Request, Response, NextFunction } from 'express';

export interface AuthRequest extends Request {
    session: ISession;
}