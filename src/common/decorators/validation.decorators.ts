import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
  Validate,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

@ValidatorConstraint({ name: 'atLeastOneProperty', async: false })
export class AtLeastOnePropertyConstraint
  implements ValidatorConstraintInterface
{
  validate(_: unknown, args: ValidationArguments): boolean {
    const object = args.object as Record<string, unknown>;

    return Object.keys(object).some(
      (key) => object[key] !== undefined && object[key] !== null,
    );
  }

  defaultMessage(): string {
    return 'Informe ao menos um campo válido para atualização.';
  }
}

export function AtLeastOneProperty(validationOptions?: ValidationOptions) {
  return function (target: Function) {
    Validate(AtLeastOnePropertyConstraint, validationOptions)(
      target.prototype,
      '_atLeastOneProperty',
    );
  };
}

export function IsImmutable(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isImmutable',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any) {
          return value === undefined || value === null;
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} não pode ser alterado`;
        },
      },
    });
  };
}
