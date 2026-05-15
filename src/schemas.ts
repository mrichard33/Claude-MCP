import { z } from 'zod';

export const listFilesSchema = z.object({
  path: z.string().default(''),
  branch: z.string().optional(),
});

export const getFileSchema = z.object({
  path: z.string().min(1, 'path is required'),
  branch: z.string().optional(),
});

export const createOrUpdateFileSchema = z.object({
  path: z.string().min(1, 'path is required'),
  content: z.string(),
  message: z.string().min(1, 'commit message is required'),
  branch: z.string().min(1, 'branch is required'),
  sha: z.string().optional(),
  allow_main: z.boolean().default(false),
});

export const createBranchSchema = z.object({
  branch: z.string().min(1, 'new branch name is required'),
  from_branch: z.string().default('dev'),
});

export const searchCodeSchema = z.object({
  query: z.string().min(1, 'query is required'),
  path: z.string().optional(),
});
