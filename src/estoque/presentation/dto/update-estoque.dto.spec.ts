import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { UpdateEstoqueDto } from './update-estoque.dto';

describe('UpdateEstoqueDto (ValidationPipe)', () => {
  const pipe = new ValidationPipe({
    transform: true,
    whitelist: true,
  });

  it('rejeita quantidadeFisica com mensagem da rota de operação', async () => {
    await expect(
      pipe.transform({ quantidadeFisica: 50 }, {
        type: 'body',
        metatype: UpdateEstoqueDto,
      }),
    ).rejects.toMatchObject({
      response: {
        message: [
          'quantidadeFisica não pode ser alterada neste endpoint. Use PATCH /estoque/:id/operacao.',
        ],
      },
    });
  });

  it('rejeita quantidadeReservada com mensagem da rota de operação', async () => {
    await expect(
      pipe.transform({ quantidadeReservada: 1 }, {
        type: 'body',
        metatype: UpdateEstoqueDto,
      }),
    ).rejects.toMatchObject({
      response: {
        message: [
          'quantidadeReservada não pode ser alterada neste endpoint. Use PATCH /estoque/:id/operacao.',
        ],
      },
    });
  });

  it('aceita apenas campos cadastrais', async () => {
    const result = (await pipe.transform(
      { codigo: 'PCA-010', precoUnitario: 99.9 },
      { type: 'body', metatype: UpdateEstoqueDto },
    )) as UpdateEstoqueDto;

    expect(result).toEqual({ codigo: 'PCA-010', precoUnitario: 99.9 });
  });

  it('propaga BadRequestException para o filter HTTP', async () => {
    await expect(
      pipe.transform({ quantidadeFisica: 99 }, {
        type: 'body',
        metatype: UpdateEstoqueDto,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
