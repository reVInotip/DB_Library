import * as jwt  from 'jsonwebtoken';
import * as bcrypt from 'bcryptjs';
import { authConfig } from '../../config/auth';
import { User } from '../entities/user/user';
import { UserDataSource } from '../data-source';

export class AuthService {
    private userRepository = UserDataSource.getRepository(User);

    async authenticate(email: string, password: string): Promise<[User, string] | null> {
        const user = await this.validateUser(email, password);
        if (!user) {
            return null
        };

        const token = this.generateToken(user);
        return [user, token]
    }

    private generateToken(user: User): string {
        return jwt.sign(
            { userId: user.userId, role: user.role.roleName },
            authConfig.secret,
            { expiresIn: authConfig.expiresIn, algorithm: 'HS256' } as jwt.SignOptions
        );
    }

    getTokenExpiredDate(token: string): Date {
        const decoded = jwt.verify(token, authConfig.secret) as jwt.JwtPayload;
        return new Date(decoded.exp! * 1000);
    }

    async validateUser(email: string, password: string): Promise<User | null> {
        const user = await this.userRepository.findOne({ where: { email } });
        
        if (!user) {
            return null;
        }

        const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
        return isPasswordValid ? user : null;
    }
}