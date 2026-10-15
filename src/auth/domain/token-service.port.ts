import type { Principal } from '../../shared/domain/principal';

/** Token de acceso emitido tras autenticar. */
export interface IssuedToken {
  readonly accessToken: string;
  readonly tokenType: 'Bearer';
  readonly expiresIn: number;
}

/**
 * Puerto para emitir y verificar tokens. La aplicación no sabe si debajo hay
 * jsonwebtoken, jose o un KMS: depende solo de este contrato (DIP).
 */
export interface TokenService {
  /**
   * Firma un token de acceso para la identidad.
   * @param principal Identidad autenticada.
   * @returns Token emitido.
   */
  issue(principal: Principal): Promise<IssuedToken>;

  /**
   * Verifica firma, caducidad, emisor y audiencia.
   * @param token Token recibido en la cabecera Authorization.
   * @returns La identidad contenida en el token.
   * @throws {InvalidTokenError} Si el token no es válido.
   */
  verify(token: string): Promise<Principal>;
}

/** Token de inyección del puerto. */
export const TOKEN_SERVICE = Symbol('TOKEN_SERVICE');
