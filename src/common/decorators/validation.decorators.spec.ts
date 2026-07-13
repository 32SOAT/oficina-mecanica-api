import { validateSync } from 'class-validator';
import { AtLeastOneProperty, IsImmutable } from './validation.decorators';

class DtoComImutavel {
  @IsImmutable()
  id?: string | null;
}

describe('IsImmutable', () => {
  it('aceita undefined e null (campo não enviado na alteração)', () => {
    expect(validateSync(new DtoComImutavel())).toHaveLength(0);
    expect(
      validateSync(Object.assign(new DtoComImutavel(), { id: null })),
    ).toHaveLength(0);
  });

  it('rejeita quando há valor definido e mensagem é amigável', () => {
    const dto = Object.assign(new DtoComImutavel(), { id: 'fixo' });
    const errors = validateSync(dto);
    expect(errors).toHaveLength(1);
    expect(errors[0].constraints?.isImmutable).toBe('id não pode ser alterado');
  });
});

@AtLeastOneProperty()
class DtoPatch {
  nome?: string;
  email?: string;
}

describe('AtLeastOneProperty', () => {
  it('rejeita corpo vazio', () => {
    const errors = validateSync(new DtoPatch());
    expect(errors).toHaveLength(1);
    expect(errors[0].constraints?.atLeastOneProperty).toBe(
      'Informe ao menos um campo válido para atualização.',
    );
  });

  it('aceita quando ao menos um campo permitido está presente', () => {
    const errors = validateSync(Object.assign(new DtoPatch(), { nome: 'João' }));
    expect(errors).toHaveLength(0);
  });
});
