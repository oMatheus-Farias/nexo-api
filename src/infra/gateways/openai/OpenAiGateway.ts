import { BadRequest } from '@application/errors/http/BadRequest';
import { Injectable } from '@kermel/decorators/Injectable';
import { env } from '@shared/config/env';
import OpenAI from 'openai';
import { z } from 'zod';

const aiResponseSchema = z.object({
  summary_text: z.string().min(40).max(8000),
});

export abstract class IOpenAiGateway {
  abstract generateGithubRepositoryReport(
    input: OpenAiGateway.GenerateGithubRepositoryReportInput,
  ): Promise<OpenAiGateway.GenerateGithubRepositoryReportOutput>;
}

@Injectable()
export class OpenAiGateway implements IOpenAiGateway {
  private readonly client: OpenAI;

  constructor() {
    if (!env.OPENAI_API_KEY) {
      throw new BadRequest('OPENAI_API_KEY is not configured in the environment.');
    }

    this.client = new OpenAI({
      apiKey: env.OPENAI_API_KEY,
    });
  }

  async generateGithubRepositoryReport(
    input: OpenAiGateway.GenerateGithubRepositoryReportInput,
  ): Promise<OpenAiGateway.GenerateGithubRepositoryReportOutput> {
    const styleGuidelines = this.getStyleGuidelines(input.reportStyle);

    const response = await this.client.responses.create({
      model: env.OPENAI_MODEL,
      temperature: 0.2,
      instructions:
        'You are an engineering manager assistant that writes concise and objective repository activity reports. You must output valid JSON only, without markdown and without any extra text.',
      input: [
        {
          role: 'user',
          content: [
            {
              type: 'input_text',
              text: [
                'Create a repository activity report based on the compact activity digest below.',
                'The period is inclusive.',
                `Selected report style: ${input.reportStyle}.`,
                'Return a JSON object with this exact shape:',
                '{"summary_text":"string"}',
                'Rules:',
                '- summary_text must be in Brazilian Portuguese.',
                '- summary_text must include: overview, throughput, quality signals, and risks/blockers.',
                '- Use only the provided digest. Do not invent events or metrics.',
                '- Follow the style guidelines below:',
                ...styleGuidelines,
                '',
                `Payload: ${JSON.stringify(input)}`,
              ].join('\n'),
            },
          ],
        },
      ],
    });

    const content = this.tryExtractJson(response.output_text);
    const parsed = aiResponseSchema.parse(content);

    const usage = response.usage as
      | {
          total_tokens?: number;
          output_tokens?: number;
          input_tokens?: number;
        }
      | undefined;

    return {
      summaryText: parsed.summary_text,
      usage: {
        totalTokens: usage?.total_tokens ?? 0,
        inputTokens: usage?.input_tokens ?? 0,
        outputTokens: usage?.output_tokens ?? 0,
      },
      model: env.OPENAI_MODEL,
    };
  }

  private tryExtractJson(outputText: string): unknown {
    const text = outputText?.trim();

    if (!text) {
      throw new BadRequest('OpenAI response did not return text content.');
    }

    try {
      return JSON.parse(text);
    } catch {
      const firstCurly = text.indexOf('{');
      const lastCurly = text.lastIndexOf('}');

      if (firstCurly === -1 || lastCurly === -1 || firstCurly >= lastCurly) {
        throw new BadRequest('OpenAI response did not return a valid JSON object.');
      }

      const candidate = text.slice(firstCurly, lastCurly + 1);
      return JSON.parse(candidate);
    }
  }

  private getStyleGuidelines(style: OpenAiGateway.ReportStyle): string[] {
    switch (style) {
      case 'TECHNICAL':
        return [
          '- Prioritize technical depth: architecture signals, refactors, risk hotspots, and code quality indicators.',
          '- Mention concrete engineering impacts (stability, maintainability, performance) and trade-offs.',
          '- Use precise and objective technical wording, avoid generic management language.',
        ];

      case 'SPRINT':
        return [
          '- Organize the narrative as sprint delivery: completed work, carry-over, blockers, and next actions.',
          '- Emphasize throughput and delivery outcomes, relating PRs/commits to execution progress.',
          '- Keep the tone action-oriented and oriented to planning/review ceremony.',
        ];

      case 'WEEKLY':
        return [
          '- Organize the narrative as a weekly status update: what progressed, what changed, and pending risks.',
          '- Keep concise paragraphs suitable for weekly communication to stakeholders.',
          '- Highlight week-over-week momentum signals based only on the provided period.',
        ];

      case 'EXECUTIVE':
      default:
        return [
          '- Prioritize business impact and decision-making clarity with minimal technical jargon.',
          '- Summarize outcomes, major risks, and recommended focus areas for leadership.',
          '- Keep the narrative concise, strategic, and easy to scan.',
        ];
    }
  }
}

export namespace OpenAiGateway {
  export type GenerateGithubRepositoryReportInput = {
    reportStyle: ReportStyle;
    repository: {
      fullName: string;
      isPrivate: boolean;
    };
    period: {
      start: string;
      end: string;
      totalDays: number;
    };
    metrics: {
      totalCommits: number;
      totalPullRequests: number;
      mergedPullRequests: number;
      openPullRequests: number;
      totalIssues: number;
      closedIssues: number;
      topContributors: Array<{
        login: string;
        commits: number;
      }>;
    };
    activityDigest: {
      recentCommits: Array<{
        authorLogin: string;
        message: string;
        committedAt: string;
      }>;
      recentPullRequests: Array<{
        number: number;
        title: string;
        state: 'open' | 'closed';
        merged: boolean;
        updatedAt: string;
      }>;
      recentIssues: Array<{
        number: number;
        title: string;
        state: 'open' | 'closed';
        comments: number;
        updatedAt: string;
      }>;
    };
  };

  export type GenerateGithubRepositoryReportOutput = {
    summaryText: string;
    usage: {
      totalTokens: number;
      inputTokens: number;
      outputTokens: number;
    };
    model: string;
  };

  export type ReportStyle = 'EXECUTIVE' | 'TECHNICAL' | 'SPRINT' | 'WEEKLY';
}
