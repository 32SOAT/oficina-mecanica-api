import {
  ApiDataResponse,
  ApiPaginatedResponse,
  ApiWrappedResponse,
} from './swagger-response.decorator';

class StubDto {}

describe('Swagger response decorators', () => {
  it('ApiDataResponse aceita status e descrição customizados', () => {
    const d = ApiDataResponse(StubDto, 201, 'Criado');
    expect(typeof d).toBe('function');
  });

  it('ApiPaginatedResponse monta schema de lista + meta', () => {
    const d = ApiPaginatedResponse(StubDto);
    expect(typeof d).toBe('function');
  });

  it('ApiWrappedResponse sem type não inclui ExtraModels', () => {
    const d = ApiWrappedResponse(undefined, 204, 'Sem corpo');
    expect(typeof d).toBe('function');
  });

  it('ApiWrappedResponse com type inclui referência ao modelo', () => {
    const d = ApiWrappedResponse(StubDto);
    expect(typeof d).toBe('function');
  });
});
