import { Controller, Get } from '@nestjs/common';
import { LanguagesService } from './languages.service';
import { Public } from '@/modules/auth/decorators/public.decorator';

@Controller('languages')
export class LanguagesController {
  constructor(private readonly languagesService: LanguagesService) {}

  @Get()
  @Public()
  async getAvailableLanguages() {
    return this.languagesService.getAllLanguages();
  }
}
