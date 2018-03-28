import {Field, PropertyInterface, AttributeInterface} from 'pimfront/product-grid/domain/model/field';
import {Operator} from 'pimfront/product-grid/domain/model/filter/operator';
import {Value} from 'pimfront/product-grid/domain/model/filter/value';
import {Property, Attribute} from 'pimfront/product-grid/domain/model/field';

export interface NormalizedFilter {
  field: string;
  operator: string;
  value: any;
}

export default interface Filter {
  field: Field;
  operator: Operator;
  value: Value;
  isEmpty: () => boolean;
  getOperators(): Operator[];
  normalize(): NormalizedFilter;
};

abstract class BaseFilter implements Filter {
  readonly field: Field;
  readonly operator: Operator;
  readonly value: Value;

  protected constructor(field: Field, operator: Operator, value: Value) {
    this.field = field;
    this.operator = operator;
    this.value = value;
  }

  isEmpty(): boolean {
    return this.operator.needValue && this.value.isEmpty();
  }

  abstract getOperators(): Operator[];

  normalize(): NormalizedFilter {
    return {
      field: this.field.identifier,
      operator: this.operator.identifier,
      value: this.value.getValue(),
    };
  }
}

export abstract class PropertyFilter extends BaseFilter {
  readonly field: PropertyInterface;

  public static createEmptyFromProperty(property: Property): Filter {
    throw Error('You need to implement the createEmptyFromProperty method');
  }
}

export abstract class AttributeFilter extends BaseFilter {
  readonly field: AttributeInterface;

  public static createEmptyFromAttribute(Attribute: Attribute): Filter {
    throw Error('You need to implement the createEmptyFromAttribute method');
  }
}
