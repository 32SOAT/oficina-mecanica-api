import { CallHandler, ExecutionContext } from '@nestjs/common';
import { of } from 'rxjs';
import { TransformResponseInterceptor } from './transform-response.interceptor';

describe('TransformResponseInterceptor', () => {
  const interceptor = new TransformResponseInterceptor();
  const context = {} as ExecutionContext;

  it('returns empty array when response is falsy', (done) => {
    const next: CallHandler = { handle: () => of(null) };
    interceptor.intercept(context, next).subscribe((result) => {
      expect(result).toEqual({ data: [] });
      done();
    });
  });

  it('preserves wrapped response with data and meta', (done) => {
    const payload = { data: [{ id: 1 }], meta: { totalItems: 1 } };
    const next: CallHandler = { handle: () => of(payload) };
    interceptor.intercept(context, next).subscribe((result) => {
      expect(result).toEqual(payload);
      done();
    });
  });

  it('wraps plain response into data property', (done) => {
    const next: CallHandler = { handle: () => of({ id: 123 }) };
    interceptor.intercept(context, next).subscribe((result) => {
      expect(result).toEqual({ data: { id: 123 } });
      done();
    });
  });
});
