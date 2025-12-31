import bcrypt from 'bcryptjs';

const DEFAULT_ROUNDS = parseInt(process.env.BCRYPT_SALT_ROUNDS || '12');

export const isBcryptHash = (value: string) => /^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/.test(value);

export async function hashPasswordIfNeeded(passwordOrHash: string, rounds: number = DEFAULT_ROUNDS): Promise<string> {
    if (!passwordOrHash) return passwordOrHash;
    if (isBcryptHash(passwordOrHash)) return passwordOrHash;
    return bcrypt.hash(passwordOrHash, rounds);
}


export async function comparePasswords(plain: string, hash: string): Promise<boolean> {
    return bcrypt.compare(plain, hash);
}