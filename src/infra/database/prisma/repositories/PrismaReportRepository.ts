import { prismaClient } from '@infra/clients/prismaClient';
import { Injectable } from '@kermel/decorators/Injectable';

@Injectable()
export class PrismaReportRepository {
  async createWithUsage(input: {
    userId: string;
    repositoryId: string;
    periodStart: Date;
    periodEnd: Date;
    summaryText: string;
    usage: {
      model: string;
      totalTokens: number;
    };
  }): Promise<{ id: string; createdAt: Date }> {
    return prismaClient.$transaction(async (transaction) => {
      const report = await transaction.report.create({
        data: {
          userId: input.userId,
          repositoryId: input.repositoryId,
          sourceProvider: 'GITHUB',
          periodStart: input.periodStart,
          periodEnd: input.periodEnd,
          summaryText: input.summaryText,
        },
        select: {
          id: true,
          createdAt: true,
        },
      });

      await transaction.usageLog.create({
        data: {
          userId: input.userId,
          reportId: report.id,
          model: input.usage.model,
          tokensUsed: input.usage.totalTokens,
        },
      });

      return report;
    });
  }
}
