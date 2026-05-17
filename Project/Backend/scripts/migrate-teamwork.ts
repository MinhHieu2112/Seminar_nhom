import { PrismaClient as SchedulerClient } from '@prisma/scheduler-client';
import { PrismaClient as TeamworkClient } from '@prisma/teamwork-client';

async function migrate() {
  const scheduler = new SchedulerClient();
  const teamwork = new TeamworkClient();

  console.log('--- Starting Teamwork Data Migration ---');

  // 1. Migrate Groups
  const groups = await (scheduler as any).group.findMany({
    include: { members: true, invitations: true, tasks: true },
  });

  console.log(`Found ${groups.length} groups to migrate.`);

  for (const group of groups) {
    console.log(`Migrating group: ${group.name} (${group.id})`);

    // Create group
    await teamwork.group.upsert({
      where: { id: group.id },
      update: {},
      create: {
        id: group.id,
        name: group.name,
        description: group.description,
        creatorId: group.creatorId,
        createdAt: group.createdAt,
        updatedAt: group.updatedAt,
      },
    });

    // Migrate members
    for (const member of group.members) {
      await teamwork.groupMember.upsert({
        where: { groupId_userId: { groupId: group.id, userId: member.userId } },
        update: {},
        create: {
          id: member.id,
          groupId: group.id,
          userId: member.userId,
          role: member.role,
          joinedAt: member.joinedAt,
        },
      });
    }

    // Migrate invitations
    for (const invite of group.invitations) {
      await teamwork.groupInvitation.upsert({
        where: { groupId_userId: { groupId: group.id, userId: invite.userId } },
        update: {},
        create: {
          id: invite.id,
          groupId: group.id,
          userId: invite.userId,
          inviterId: invite.inviterId,
          status: invite.status,
          createdAt: invite.createdAt,
          updatedAt: invite.updatedAt,
        },
      });
    }

    // Migrate tasks (Group tasks only)
    for (const task of group.tasks) {
      await teamwork.groupTask.upsert({
        where: { id: task.id },
        update: {},
        create: {
          id: task.id,
          groupId: group.id,
          creatorId: task.userId,
          assigneeId: task.assigneeId,
          title: task.title,
          description: task.description,
          dueTime: task.dueTime,
          priority: task.priority,
          status: task.status,
          submittedForReview: task.submittedForReview,
          createdAt: task.createdAt,
          updatedAt: task.updatedAt,
        },
      });
    }
  }

  console.log('--- Migration Completed Successfully ---');

  await scheduler.$disconnect();
  await teamwork.$disconnect();
}

migrate().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
