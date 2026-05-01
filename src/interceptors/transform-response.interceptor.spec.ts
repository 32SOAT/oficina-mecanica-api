import { of } from 'rxjs';
import { TransformResponseInterceptor } from './transform-response.interceptor';

describe('TransformResponseInterceptor', () => {
  const interceptor = new TransformResponseInterceptor();
  const context = {} as any;

  it('returns empty array when response is falsy', (done) => {
    const next = { handle: () => of(null) } as any;
    interceptor.intercept(context, next).subscribe((result) => {
      expect(result).toEqual({ data: [] });
      done();
    });
  });

  it('preserves wrapped response with data and meta', (done) => {
    const payload = { data: [{ id: 1 }], meta: { totalItems: 1 } };
    const next = { handle: () => of(payload) } as any;
    interceptor.intercept(context, next).subscribe((result) => {
      expect(result).toEqual(payload);
      done();
    });
  });

  it('wraps plain response into data property', (done) => {
    const next = { handle: () => of({ id: 123 }) } as any;
    interceptor.intercept(context, next).subscribe((result) => {
      expect(result).toEqual({ data: { id: 123 } });
      done();
    });
  });
});
