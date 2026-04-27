import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from 'class-validator';

/**
 * Decorator que impede a alteração de campos específicos
 * @param validationOptions Opções de validação
 * @returns Decorator function
 */
export function IsImmutable(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isImmutable',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          return value === undefined || value === null;
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} não pode ser alterado`;
        },
      },
    });
  };
}
