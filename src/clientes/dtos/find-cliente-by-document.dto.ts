import { IsNotEmpty, IsString } from 'class-validator';

export class FindClienteByDocumentDto {
  @IsNotEmpty()
  @IsString()
  documento: string;
}
