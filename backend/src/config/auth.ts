export const authConfig = {
    secret: process.env.JWT_SECRET || 'your-very-secure-secret-key',
    expiresIn: '1h', // Время жизни токена
    saltRounds: 10 // Для хеширования паролей
};