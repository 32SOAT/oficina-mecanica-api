import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { UpdateEstoqueDto } from './update-estoque.dto';

describe('UpdateEstoqueDto (ValidationPipe)', () => {
  it('rejeita quantidadeFisica quando forbidNonWhitelisted está habilitado', async () => {
    const pipe = new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    });

    await expect(
      pipe.transform(
        {
          codigo: 'PCA-010',
          quantidadeFisica: 99,
        },
        { type: 'body', metatype: UpdateEstoqueDto },
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
