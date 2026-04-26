import { PartialType } from '@nestjs/mapped-types';
import { CreatePecaDto } from './create-peca.dto';

export class UpdatePecaDto extends PartialType(CreatePecaDto) {}
