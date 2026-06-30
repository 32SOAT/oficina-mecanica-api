import { PartialType } from '@nestjs/mapped-types';
import { AtLeastOneProperty } from '../../../common/decorators/validation.decorators';
import { CreateUserDto } from './create-user.dto';

@AtLeastOneProperty()
export class UpdateUserDto extends PartialType(CreateUserDto) {}
