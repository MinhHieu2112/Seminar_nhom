import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/shared/database/prisma.service';
import { LanguageDto } from '@/modules/users/dto/language.dto';

@Injectable()
export class LanguagesService {
  constructor(private prisma: PrismaService) {}

  async getAllLanguages(): Promise<LanguageDto[]> {
    const languages = await this.prisma.languages.findMany({
      orderBy: { created_at: 'desc' },
    });

    return languages.map((lang) => ({
      id: lang.id.toString(),
      name: lang.name,
      slug: lang.name.toLowerCase().replace(/\s+/g, '-'),
      icon: '📚',
      description: lang.name,
      created_at: lang.created_at?.toISOString(),
    }));
  }
}
