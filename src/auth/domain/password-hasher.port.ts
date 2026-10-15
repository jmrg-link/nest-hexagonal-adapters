/**
 * Puerto para derivar y comprobar hashes de contraseña. Permite cambiar scrypt
 * por argon2 o bcrypt sin tocar los casos de uso.
 */
export interface PasswordHasher {
  /**
   * Deriva un hash con sal aleatoria.
   * @param plain Contraseña en claro.
   * @returns Hash autodescriptivo (algoritmo, parámetros, sal y clave).
   */
  hash(plain: string): Promise<string>;

  /**
   * Compara en tiempo constante.
   * @param plain Contraseña en claro.
   * @param hash Hash almacenado.
   * @returns `true` si coinciden.
   */
  verify(plain: string, hash: string): Promise<boolean>;
}

/** Token de inyección del puerto. */
export const PASSWORD_HASHER = Symbol('PASSWORD_HASHER');
