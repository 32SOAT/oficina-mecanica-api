# 📋 Script Padrão para Criar Novo Domínio

Baseado no padrão implementado em `clientes/`.

---

## 📁 1. ESTRUTURA DE PASTAS

```
src/[nomes]/
├── [nome].controller.ts
├── [nome].controller.spec.ts
├── [nome].service.ts
├── [nome].service.spec.ts
├── [nome].entity.ts
├── [nome].module.ts
├── dtos/
│   ├── create-[nome].dto.ts
│   ├── update-[nome].dto.ts
│   └── find-[nome]-by-*.dto.ts (opcional)
└── [validador-customizado].ts (se necessário)
```

---

## 🏗️ 2. ENTITY + MIGRATION

### Entity: `[nome].entity.ts`
```typescript
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, 
         UpdateDateColumn, DeleteDateColumn, Index } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('[nome]')
export class [Nome]Entity {
  @ApiProperty({ description: 'ID único' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'Campo descritivo' })
  @Column()
  campo1: string;

  @Column()
  campo2?: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp', precision: 3 })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp', precision: 3 })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamp', precision: 3 })
  deletedAt: Date | null;
}
```

### Migration: `XXXXX-create-[nome].ts`
```typescript
import { MigrationInterface, QueryRunner } from 'typeorm';

export class Create[Nome]XXXXX implements MigrationInterface {
  name = 'Create[Nome]XXXXX';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "[nome]" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "campo1" character varying NOT NULL,
        "campo2" character varying,
        "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP(3),
        "deleted_at" TIMESTAMP(3),
        CONSTRAINT "PK_[nome]" PRIMARY KEY ("id"),
        CONSTRAINT "FK_[nome]_relacao" FOREIGN KEY ("relacao_id") 
          REFERENCES "outra_tabela" ("id") ON DELETE RESTRICT
      )
    `);
    
    // ⚠️ IMPORTANTE: Índice parcial para soft delete (permite reutilizar dados deletados)
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_[nome]_campo1" ON "[nome]" ("campo1") WHERE "deleted_at" IS NULL`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_[nome]_relacao_id" ON "[nome]" ("relacao_id")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_[nome]_relacao_id"`);
    await queryRunner.query(`DROP INDEX "IDX_[nome]_campo1"`);
    await queryRunner.query(`DROP TABLE "[nome]"`);
  }
}
```

---

## ✔️ 3. DTOs COM VALIDAÇÕES

### `create-[nome].dto.ts`
```typescript
import { IsNotEmpty, IsString, IsOptional, IsNumber, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class Create[Nome]Dto {
  @ApiProperty({ description: 'Campo obrigatório' })
  @IsNotEmpty()
  @IsString()
  campo1: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  campo2?: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  valor: number;
}
```

### `update-[nome].dto.ts`
```typescript
import { PartialType } from '@nestjs/mapped-types';
import { Create[Nome]Dto } from './create-[nome].dto';

export class Update[Nome]Dto extends PartialType(Create[Nome]Dto) {}
```

### `find-[nome]-by-*.dto.ts` (se houver busca especial)
```typescript
import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class Find[Nome]By[Campo]Dto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  [campo]: string;
}
```

---

## 🧪 4. VALIDADOR CUSTOMIZADO (se necessário)

### `[validador].ts`
```typescript
export function normalize[Campo](raw: string): string {
  return raw.trim().toUpperCase();
}

export function isValid[Campo](value: string): boolean {
  // Adicione lógica de validação específica
  return value.length > 0;
}
```

### `[validador].spec.ts`
```typescript
import { isValid[Campo], normalize[Campo] } from './[validador]';

describe('[Validador]', () => {
  it('valida [campo] correto', () => {
    expect(isValid[Campo]('valor-valido')).toBe(true);
  });

  it('normaliza [campo] com espaços', () => {
    expect(normalize[Campo]('  VALOR  ')).toBe('VALOR');
  });
});
```

---

## 💼 5. SERVICE

### `[nome].service.ts`
```typescript
import { Injectable, BadRequestException, ConflictException, HttpException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaginationDto } from '../querying/dtos/pagination.dto';
import { PaginationService } from '../querying/pagination.service';
import { [Nome]Entity } from './[nome].entity';
import { Create[Nome]Dto } from './dtos/create-[nome].dto';
import { Update[Nome]Dto } from './dtos/update-[nome].dto';

@Injectable()
export class [Nome]Service {
  constructor(
    @InjectRepository([Nome]Entity)
    private readonly [nome]Repository: Repository<[Nome]Entity>,
    private readonly paginationService: PaginationService,
  ) {}

  async create(create[Nome]Dto: Create[Nome]Dto): Promise<[Nome]Entity> {
    // 1️⃣ Validar dados
    // 2️⃣ Verificar duplicatas com QueryBuilder (soft delete aware)
    // 3️⃣ Validar relacionamentos se houver
    // 4️⃣ Criar e salvar
    
    const duplicate = await this.[nome]Repository
      .createQueryBuilder('[nome]')
      .where('[nome].campo1 = :valor', { valor: create[Nome]Dto.campo1 })
      .andWhere('[nome].deletedAt IS NULL')
      .getOne();

    if (duplicate) {
      throw new ConflictException('Campo1 já existe');
    }

    const data = this.[nome]Repository.create(create[Nome]Dto);
    return this.[nome]Repository.save(data);
  }

  async findAll(paginationDto: PaginationDto) {
    const page = Number(paginationDto.page ?? 1);
    const take = Number(paginationDto.take ?? 10);
    const offset = this.paginationService.calculateOffset(take, page);

    const [data, count] = await this.[nome]Repository.findAndCount({
      skip: offset,
      take,
    });

    const meta = this.paginationService.createMeta(take, page, count);
    return { data, meta };
  }

  async findOne(id: string): Promise<[Nome]Entity> {
    const entity = await this.[nome]Repository.findOneBy({ id });
    if (!entity) {
      throw new HttpException('Registro não encontrado', 404);
    }
    return entity;
  }

  async findBy[Campo](valor: string): Promise<[Nome]Entity> {
    // Validar formato se necessário
    const entity = await this.[nome]Repository
      .createQueryBuilder('[nome]')
      .where('[nome].campo = :valor', { valor })
      .andWhere('[nome].deletedAt IS NULL')
      .getOne();

    if (!entity) {
      throw new HttpException('Registro não encontrado', 404);
    }
    return entity;
  }

  async update(id: string, update[Nome]Dto: Update[Nome]Dto): Promise<[Nome]Entity> {
    const existing = await this.findOne(id);
    
    // Se alterar campo único, verificar duplicata
    if (update[Nome]Dto.campo1) {
      const duplicate = await this.[nome]Repository
        .createQueryBuilder('[nome]')
        .where('[nome].campo1 = :valor', { valor: update[Nome]Dto.campo1 })
        .andWhere('[nome].deletedAt IS NULL')
        .andWhere('[nome].id != :id', { id })
        .getOne();

      if (duplicate) {
        throw new ConflictException('Campo1 já existe');
      }
    }

    const merged = this.[nome]Repository.merge(existing, update[Nome]Dto);
    return this.[nome]Repository.save(merged);
  }

  async remove(id: string): Promise<[Nome]Entity> {
    const existing = await this.findOne(id);
    return this.[nome]Repository.softRemove(existing);
  }
}
```

### `[nome].service.spec.ts`
```typescript
import { Repository, SelectQueryBuilder } from 'typeorm';
import { [Nome]Service } from './[nome].service';
import { [Nome]Entity } from './[nome].entity';
import { PaginationService } from '../querying/pagination.service';
import { Create[Nome]Dto } from './dtos/create-[nome].dto';

describe('[Nome]Service', () => {
  let service: [Nome]Service;
  let repository: jest.Mocked<Repository<[Nome]Entity>>;

  const createQueryBuilderMock = (value?: unknown): SelectQueryBuilder<[Nome]Entity> => {
    const qb = {
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getOne: jest.fn().mockResolvedValue(value),
    } as unknown as SelectQueryBuilder<[Nome]Entity>;
    return qb;
  };

  beforeEach(() => {
    repository = {
      create: jest.fn(),
      save: jest.fn(),
      findAndCount: jest.fn(),
      findOneBy: jest.fn(),
      merge: jest.fn(),
      softRemove: jest.fn(),
      createQueryBuilder: jest.fn(),
    } as any;

    service = new [Nome]Service(repository, new PaginationService());
  });

  // ✅ Teste: criar com sucesso
  it('creates entity', async () => {
    const dto: Create[Nome]Dto = { campo1: 'valor' };
    const entity = { id: '1', ...dto } as [Nome]Entity;

    repository.createQueryBuilder.mockReturnValue(createQueryBuilderMock(null));
    repository.create.mockReturnValue(entity);
    repository.save.mockResolvedValue(entity);

    const result = await service.create(dto);
    expect(result).toEqual(entity);
  });

  // ✅ Teste: rejeitar duplicata
  it('rejects duplicate', async () => {
    const dto: Create[Nome]Dto = { campo1: 'valor' };
    const existing = { id: '1', ...dto } as [Nome]Entity;

    repository.createQueryBuilder.mockReturnValue(createQueryBuilderMock(existing));

    await expect(service.create(dto)).rejects.toThrow('ConflictException');
  });

  // ✅ Teste: soft delete
  it('soft removes', async () => {
    const entity = { id: '1' } as [Nome]Entity;
    repository.findOneBy.mockResolvedValue(entity);
    repository.softRemove.mockResolvedValue(entity);

    const result = await service.remove('1');
    expect(repository.softRemove).toHaveBeenCalledWith(entity);
  });

  // ✅ Teste: reutilizar dados deletados
  it('allows reusing deleted data', async () => {
    const dto: Create[Nome]Dto = { campo1: 'valor-deletado' };
    
    // Query builder não encontra (deletado)
    repository.createQueryBuilder.mockReturnValue(createQueryBuilderMock(null));
    repository.create.mockReturnValue({ id: '2', ...dto } as [Nome]Entity);
    repository.save.mockResolvedValue({ id: '2', ...dto } as [Nome]Entity);

    const result = await service.create(dto);
    expect(result).toBeDefined();
  });
});
```

---

## 🎯 6. CONTROLLER

### `[nome].controller.ts`
```typescript
import { Controller, Get, Post, Patch, Delete, Body, Param, Query, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiParam, ApiQuery } from '@nestjs/swagger';
import { [Nome]Service } from './[nome].service';
import { PaginationDto } from '../querying/dtos/pagination.dto';
import { Create[Nome]Dto } from './dtos/create-[nome].dto';
import { Update[Nome]Dto } from './dtos/update-[nome].dto';

@ApiTags('[Nomes]')
@Controller('[nomes]')
export class [Nome]Controller {
  constructor(private readonly [nome]Service: [Nome]Service) {}

  @Post()
  @ApiOperation({ summary: 'Criar novo [nome]', description: '...' })
  @ApiBody({ type: Create[Nome]Dto })
  @ApiResponse({ status: 201, description: '[Nome] criado com sucesso' })
  async create(@Body() dto: Create[Nome]Dto) {
    return this.[nome]Service.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar com paginação' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'take', required: false, type: Number })
  async findAll(@Query() paginationDto: PaginationDto) {
    return this.[nome]Service.findAll(paginationDto);
  }

  @Post('by-[campo]')
  @ApiOperation({ summary: 'Buscar por [campo]' })
  @ApiBody({ type: Find[Nome]By[Campo]Dto })
  async findBy[Campo](@Body() dto: Find[Nome]By[Campo]Dto) {
    const data = await this.[nome]Service.findBy[Campo](dto.[campo]);
    return { success: true, data, message: 'Encontrado com sucesso' };
  }

  @Patch(':id')
  @ApiParam({ name: 'id', type: String, description: 'UUID' })
  @ApiBody({ type: Update[Nome]Dto })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: Update[Nome]Dto,
  ) {
    await this.[Nome]Service.update(id, dto);
    return { success: true, message: '[Nome] atualizado com sucesso' };
  }

  @Delete(':id')
  @ApiParam({ name: 'id', type: String })
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.[nome]Service.remove(id);
    return { success: true, message: '[Nome] removido com sucesso' };
  }
}
```

### `[nome].controller.spec.ts`
```typescript
import { [Nome]Controller } from './[nome].controller';
import { [Nome]Service } from './[nome].service';

describe('[Nome]Controller', () => {
  let controller: [Nome]Controller;
  let service: jest.Mocked<[Nome]Service>;

  const entity = { id: '1', campo1: 'valor' };

  beforeEach(() => {
    service = {
      create: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      findBy[Campo]: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    } as any;

    controller = new [Nome]Controller(service);
  });

  it('creates entity', async () => {
    service.create.mockResolvedValue(entity);
    const result = await controller.create({ campo1: 'valor' });
    expect(result).toEqual(entity);
  });

  it('updates entity', async () => {
    service.update.mockResolvedValue(entity);
    const result = await controller.update('1', { campo1: 'novo' });
    expect(result).toEqual({ success: true, message: '[Nome] atualizado com sucesso' });
  });
});
```

---

## 📦 7. MODULE

```typescript
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QueryingModule } from '../querying/querying.module';
import { [Nome]Controller } from './[nome].controller';
import { [Nome]Service } from './[nome].service';
import { [Nome]Entity } from './[nome].entity';

@Module({
  imports: [TypeOrmModule.forFeature([[Nome]Entity]), QueryingModule],
  controllers: [[Nome]Controller],
  providers: [[Nome]Service],
  exports: [[Nome]Service],
})
export class [Nome]Module {}
```

---

## 🔗 8. REGISTRAR NO APP MODULE

```typescript
// src/app.module.ts
import { [Nome]Module } from './[nomes]/[nome].module';

@Module({
  imports: [
    // ... outros módulos
    [Nome]Module,
  ],
})
export class AppModule {}
```

---

## ✅ 9. VALIDAÇÃO FINAL

```bash
# Executar testes (mínimo 80% cobertura)
npm test -- --testPathPatterns=[nome]

# Validar build
npm run build

# Iniciar servidor
npm run start:dev
```

---

## 🎨 EXEMPLO PRÁTICO: Serviços

Substitua placeholders:
- `[nome]` → `servico`
- `[Nome]` → `Servico`
- `[nomes]` → `servicos`
- Campos: `descricao`, `preco`, `categoria`
- Busca especial: `findByCategoria`

