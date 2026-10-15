import { z } from 'zod';
import { pageRequestShape, pageViewSchema } from '../../shared/application/pagination.schemas';
import { ROLES } from '../../shared/domain/principal';

/** Reglas de cada campo de usuario, reutilizadas por registro, alta y edición (DRY). */
export const userFields = {
  email: z.email().max(254).toLowerCase().describe('Email único; se normaliza a minúsculas'),
  name: z.string().trim().min(2).max(80).describe('Nombre visible'),
  password: z.string().min(8).max(128).describe('Contraseña en claro; solo de entrada'),
  role: z.enum(ROLES).describe('Rol de la cuenta'),
};

/** Alta de usuario por un administrador. */
export const createUserSchema = z
  .object({
    email: userFields.email,
    name: userFields.name,
    password: userFields.password,
    role: userFields.role.default('customer'),
  })
  .meta({ id: 'CreateUserRequest' });

/** Edición parcial; al menos un campo. */
export const updateUserSchema = z
  .object({
    email: userFields.email.optional(),
    name: userFields.name.optional(),
    password: userFields.password.optional(),
    role: userFields.role.optional(),
  })
  .refine((dto) => Object.values(dto).some((value) => value !== undefined), {
    message: 'Indica al menos un campo',
  })
  .meta({ id: 'UpdateUserRequest' });

/** Filtros y paginación del listado de usuarios. */
export const listUsersQuerySchema = z.object({
  role: userFields.role.optional(),
  ...pageRequestShape,
});

/** Vista pública de un usuario: nunca incluye el hash de la contraseña. */
export const userViewSchema = z
  .object({
    id: z.uuid(),
    email: z.email(),
    name: z.string(),
    role: z.enum(ROLES),
    createdAt: z.date(),
    updatedAt: z.date(),
  })
  .meta({ id: 'User' });

/** Página de usuarios. */
export const userPageViewSchema = pageViewSchema(userViewSchema).meta({ id: 'UserPage' });

export type CreateUserDto = z.output<typeof createUserSchema>;
export type UpdateUserDto = z.output<typeof updateUserSchema>;
export type ListUsersQuery = z.output<typeof listUsersQuerySchema>;
export type UserView = z.output<typeof userViewSchema>;
