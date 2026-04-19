import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { LessonService } from './lesson.service';
import { CreateLessonDto } from './dto/create-lesson.dto';
import { UpdateLessonDto } from './dto/update-lesson.dto';

@Controller()
export class LessonController {
  constructor(private readonly lessonService: LessonService) {}

  @MessagePattern('createLesson')
  create(@Payload() createLessonDto: CreateLessonDto) {
    return this.lessonService.create(createLessonDto);
  }

  @MessagePattern('findAllLesson')
  findAll() {
    return this.lessonService.findAll();
  }

  @MessagePattern('findOneLesson')
  findOne(@Payload() id: number) {
    return this.lessonService.findOne(id);
  }

  @MessagePattern('updateLesson')
  update(@Payload() updateLessonDto: UpdateLessonDto) {
    return this.lessonService.update(updateLessonDto.id, updateLessonDto);
  }

  @MessagePattern('removeLesson')
  remove(@Payload() id: number) {
    return this.lessonService.remove(id);
  }
}
