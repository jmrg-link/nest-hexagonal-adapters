import {
  DataTypes,
  type InferAttributes,
  type InferCreationAttributes,
  Model,
  type Sequelize,
} from 'sequelize';
import { ROLES, type Role } from '../../../../shared/domain/principal';

const USER_MODEL = 'User';

/**
 * Modelo Sequelize mapeado sobre la tabla `users` que crea la migración.
 * Se usa `declare` para no ocultar los getters de Sequelize con campos de clase.
 */
export class UserModel extends Model<
  InferAttributes<UserModel>,
  InferCreationAttributes<UserModel>
> {
  declare id: string;
  declare email: string;
  declare name: string;
  declare passwordHash: string;
  declare role: Role;
  declare createdAt: Date;
  declare updatedAt: Date;

  /**
   * Inicializa el modelo en la instancia de Sequelize (idempotente).
   * @param sequelize Instancia conectada.
   * @returns La clase del modelo lista para usar.
   */
  static initialize(sequelize: Sequelize): typeof UserModel {
    if (!sequelize.isDefined(USER_MODEL)) {
      UserModel.init(
        {
          id: { type: DataTypes.UUID, primaryKey: true },
          email: { type: DataTypes.TEXT, allowNull: false, unique: true },
          name: { type: DataTypes.TEXT, allowNull: false },
          passwordHash: { type: DataTypes.TEXT, allowNull: false },
          role: { type: DataTypes.ENUM(...ROLES), allowNull: false },
          createdAt: { type: DataTypes.DATE, allowNull: false },
          updatedAt: { type: DataTypes.DATE, allowNull: false },
        },
        {
          sequelize,
          modelName: USER_MODEL,
          tableName: 'users',
          underscored: true,
          timestamps: false,
        },
      );
    }
    return UserModel;
  }
}
