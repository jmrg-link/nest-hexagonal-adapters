import { Inject, Injectable } from '@nestjs/common';
import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
import { APP_CONFIG, type AppConfig } from '../../config/app-config';
import type { PasswordHasher } from '../domain/password-hasher.port';

const ALGORITHM = 'scrypt';
const KEY_LENGTH = 64;
const SALT_BYTES = 16;
const BLOCK_SIZE = 8;
const PARALLELISM = 1;

const derive = (plain: string, salt: Buffer, cost: number): Promise<Buffer> =>
  new Promise((resolve, reject) => {
    const options = { N: cost, r: BLOCK_SIZE, p: PARALLELISM, maxmem: 256 * cost * BLOCK_SIZE };
    scrypt(plain, salt, KEY_LENGTH, options, (error, key) =>
      error ? reject(error) : resolve(key),
    );
  });

/**
 * Adaptador del puerto PasswordHasher con scrypt de `node:crypto` (sin dependencias
 * nativas). El hash es autodescriptivo, `scrypt$N$r$p$sal$clave`, así se puede subir
 * el coste sin invalidar contraseñas antiguas. La comparación es en tiempo constante.
 */
@Injectable()
export class ScryptPasswordHasher implements PasswordHasher {
  constructor(@Inject(APP_CONFIG) private readonly config: AppConfig) {}

  async hash(plain: string): Promise<string> {
    const salt = randomBytes(SALT_BYTES);
    const cost = this.config.scryptCost;
    const key = await derive(plain, salt, cost);
    return [
      ALGORITHM,
      cost,
      BLOCK_SIZE,
      PARALLELISM,
      salt.toString('base64'),
      key.toString('base64'),
    ].join('$');
  }

  async verify(plain: string, hash: string): Promise<boolean> {
    const [algorithm, cost, , , salt, key] = hash.split('$');
    if (algorithm !== ALGORITHM || !cost || !salt || !key) {
      return false;
    }
    const expected = Buffer.from(key, 'base64');
    const actual = await derive(plain, Buffer.from(salt, 'base64'), Number(cost));
    return expected.length === actual.length && timingSafeEqual(expected, actual);
  }
}
