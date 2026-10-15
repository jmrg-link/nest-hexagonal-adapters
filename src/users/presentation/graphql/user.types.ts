import { Field, GraphQLISODateTime, ID, InputType, ObjectType } from '@nestjs/graphql';
import { ROLES, type Role } from '../../../shared/domain/principal';
import {
  graphqlEnum,
  PageInput,
  Paginated,
} from '../../../shared/presentation/graphql/common.types';

/** Enum GraphQL generado desde `ROLES` del dominio. */
export const RoleEnum = graphqlEnum(ROLES, 'Role');

/** Usuario en GraphQL; espejo de `userViewSchema`. */
@ObjectType('User', { description: 'Usuario sin datos sensibles' })
export class UserType {
  @Field(() => ID)
  id!: string;

  @Field()
  email!: string;

  @Field()
  name!: string;

  @Field(() => RoleEnum)
  role!: Role;

  @Field(() => GraphQLISODateTime)
  createdAt!: Date;

  @Field(() => GraphQLISODateTime)
  updatedAt!: Date;
}

/** Página de usuarios. */
@ObjectType('UserPage')
export class UserPageType extends Paginated(UserType) {}

/** Alta de usuario; las reglas las valida `createUserSchema`. */
@InputType()
export class CreateUserInput {
  @Field()
  email!: string;

  @Field()
  name!: string;

  @Field()
  password!: string;

  @Field(() => RoleEnum, { nullable: true })
  role?: Role;
}

/** Edición parcial; las reglas las valida `updateUserSchema`. */
@InputType()
export class UpdateUserInput {
  @Field({ nullable: true })
  email?: string;

  @Field({ nullable: true })
  name?: string;

  @Field({ nullable: true })
  password?: string;

  @Field(() => RoleEnum, { nullable: true })
  role?: Role;
}

/** Filtros del listado; las reglas las valida `listUsersQuerySchema`. */
@InputType()
export class UserFilterInput extends PageInput {
  @Field(() => RoleEnum, { nullable: true })
  role?: Role;
}
