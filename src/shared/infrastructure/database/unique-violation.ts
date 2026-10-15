/**
 * Ejecuta una escritura y traduce la violación de clave única del driver a un
 * error de dominio. Cada adaptador aporta cómo reconocer su error (11000, P2002,
 * UniqueConstraintError) y el resultado observable es idéntico: Liskov.
 * @param operation Escritura a ejecutar.
 * @param isUniqueViolation Detecta la violación en el error del driver.
 * @param toDomainError Construye el error de dominio equivalente.
 * @returns El resultado de la escritura.
 */
export const guardUnique = async <T>(
  operation: () => Promise<T>,
  isUniqueViolation: (error: unknown) => boolean,
  toDomainError: () => Error,
): Promise<T> => {
  try {
    return await operation();
  } catch (error) {
    throw isUniqueViolation(error) ? toDomainError() : error;
  }
};
