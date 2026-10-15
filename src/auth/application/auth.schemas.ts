import { z } from 'zod';
import { userFields } from '../../users/application/user.schemas';

/** Registro público: siempre crea clientes, el rol no se acepta en la entrada. */
export const registerSchema = z
  .object({ email: userFields.email, name: userFields.name, password: userFields.password })
  .meta({ id: 'RegisterRequest' });

/** Credenciales de acceso. */
export const loginSchema = z
  .object({ email: userFields.email, password: z.string().min(1).max(128) })
  .meta({ id: 'LoginRequest' });

/** Token emitido tras el login. */
export const tokenViewSchema = z
  .object({
    accessToken: z.string().describe('JWT firmado con HS256'),
    tokenType: z.literal('Bearer'),
    expiresIn: z.number().int().describe('Segundos hasta la caducidad'),
  })
  .meta({ id: 'AccessToken' });

export type RegisterDto = z.output<typeof registerSchema>;
export type LoginDto = z.output<typeof loginSchema>;
export type TokenView = z.output<typeof tokenViewSchema>;
