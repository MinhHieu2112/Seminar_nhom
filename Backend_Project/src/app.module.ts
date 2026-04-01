import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { validateEnv } from './config/env.schema';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { LanguagesModule } from './modules/languages/languages.module';
import { CoursesModule } from './modules/courses/courses.module';
import { LessonsModule } from './modules/lessons/lessons.module';
import { PracticeModule } from './modules/practice/practice.module';
import { LearningProfilesModule } from './modules/learning-profiles/learning-profiles.module';
import { ExercisesModule } from './modules/exercises/exercises.module';
import { SubmissionsModule } from './modules/submissions/submissions.module';
import { AIFeedbackModule } from './modules/ai-feedback/ai-feedback.module';
import { ProjectsModule } from './modules/projects/projects.module';
import { ForumModule } from './modules/forum/forum.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { PrismaModule } from './shared/database/prisma.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      validate: validateEnv,
    }),
    PrismaModule,
    AuthModule,
    UsersModule,
    LanguagesModule,
    CoursesModule,
    LessonsModule,
    PracticeModule,
    LearningProfilesModule,
    ExercisesModule,
    SubmissionsModule,
    AIFeedbackModule,
    ProjectsModule,
    ForumModule,
    AnalyticsModule,
  ],
})
export class AppModule {}
