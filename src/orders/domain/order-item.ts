import { InvalidOrderError } from './order.errors';

/** Datos de una línea de pedido. Los importes van en céntimos enteros. */
export interface OrderItemProps {
  readonly sku: string;
  readonly name: string;
  readonly quantity: number;
  readonly unitPriceCents: number;
}

const assertIntegerAtLeast = (value: number, field: string, min: number): void => {
  if (!Number.isInteger(value) || value < min) {
    throw new InvalidOrderError(`${field} debe ser un entero mayor o igual que ${min}`);
  }
};

/**
 * Value Object: se identifica por sus valores, es inmutable y se valida al crearse.
 * Usar céntimos enteros evita los errores de redondeo de la coma flotante.
 */
export class OrderItem {
  private constructor(private readonly props: OrderItemProps) {}

  /**
   * Crea una línea válida.
   * @param props Datos de la línea.
   * @returns Línea inmutable.
   */
  static create(props: OrderItemProps): OrderItem {
    assertIntegerAtLeast(props.quantity, 'quantity', 1);
    assertIntegerAtLeast(props.unitPriceCents, 'unitPriceCents', 0);
    return new OrderItem({ ...props, sku: props.sku.trim(), name: props.name.trim() });
  }

  get sku(): string {
    return this.props.sku;
  }

  get name(): string {
    return this.props.name;
  }

  get quantity(): number {
    return this.props.quantity;
  }

  get unitPriceCents(): number {
    return this.props.unitPriceCents;
  }

  get subtotalCents(): number {
    return this.props.quantity * this.props.unitPriceCents;
  }

  /**
   * Copia de los datos para persistir.
   * @returns Propiedades de la línea.
   */
  toProps(): OrderItemProps {
    return { ...this.props };
  }
}
