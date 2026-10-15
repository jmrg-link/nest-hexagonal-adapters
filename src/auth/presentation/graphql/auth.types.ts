import { Field, InputType, Int, ObjectType } from '@nestjs/graphql';

/** Token emitido tras el login. */
@ObjectType('AccessToken')
export class AccessTokenType {
  @Field()
  accessToken!: string;

  @Field()
  tokenType!: string;

  @Field(() => Int)
  expiresIn!: number;
}

/** Registro público; lo valida `registerSchema`. */
@InputType()
export class RegisterInput {
  @Field()
  email!: string;

  @Field()
  name!: string;

  @Field()
  password!: string;
}

/** Credenciales; las valida `loginSchema`. */
@InputType()
export class LoginInput {
  @Field()
  email!: string;

  @Field()
  password!: string;
}
