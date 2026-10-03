import { registerDecorator, type ValidationOptions } from 'class-validator';
import { isIsoDay } from '@app/contracts';

/** A `YYYY-MM-DD` that names a real calendar day — the contracts' rule, not a regex. */
export function IsIsoDay(options?: ValidationOptions): PropertyDecorator {
  return (target, propertyKey) => {
    registerDecorator({
      name: 'isIsoDay',
      target: target.constructor,
      propertyName: String(propertyKey),
      options: { message: '$property must be a day as YYYY-MM-DD', ...options },
      validator: {
        validate: (value: unknown) =>
          typeof value === 'string' && isIsoDay(value),
      },
    });
  };
}
