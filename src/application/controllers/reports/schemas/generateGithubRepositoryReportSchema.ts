import z from 'zod';

export const generateGithubRepositoryReportSchema = z
  .object({
    report_style: z.enum(['EXECUTIVE', 'TECHNICAL', 'SPRINT', 'WEEKLY']).default('EXECUTIVE'),
    repository_external_id: z
      .preprocess((value) => {
        if (typeof value === 'number') {
          return value.toString();
        }

        return value;
      }, z.string().min(1).optional())
      .optional(),
    repository_full_name: z
      .string()
      .trim()
      .min(3, "'repository_full_name' must have at least 3 characters")
      .optional(),
    period_start: z.string().describe("'period_start' must be a valid ISO datetime"),
    period_end: z.string().describe("'period_end' must be a valid ISO datetime"),
    max_items_per_type: z
      .number()
      .int("'max_items_per_type' must be an integer")
      .min(50, "'max_items_per_type' must be greater than or equal to 50")
      .max(300, "'max_items_per_type' must be less than or equal to 300")
      .optional(),
  })
  .refine((data) => !!(data.repository_external_id || data.repository_full_name), {
    message: "You must provide 'repository_external_id' or 'repository_full_name'.",
    path: ['repository_external_id'],
  });

export type GenerateGithubRepositoryReportBody = z.infer<
  typeof generateGithubRepositoryReportSchema
>;
