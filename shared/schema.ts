import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table for Replit Auth
export const sessions = pgTable("sessions", {
  sid: text("sid").primaryKey(),
  sess: jsonb("sess").notNull(),
  expire: timestamp("expire").notNull(),
});

// User storage table for Replit Auth
export const users = pgTable("users", {
  id: text("id").primaryKey(),
  username: text("username").notNull(),
  email: text("email"),
  firstName: text("first_name"),
  lastName: text("last_name"),
  profileImageUrl: text("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  currentStreak: integer("current_streak").default(0).notNull(),
  totalProblems: integer("total_problems").default(0).notNull(),
  totalXp: integer("total_xp").default(0).notNull(),
  currentSection: integer("current_section").default(1).notNull(),
  currentLesson: integer("current_lesson").default(1).notNull(),
});

export const sections = pgTable("sections", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  orderIndex: integer("order_index").notNull(),
  isLocked: boolean("is_locked").default(true).notNull(),
});

export const lessons = pgTable("lessons", {
  id: serial("id").primaryKey(),
  sectionId: integer("section_id").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  orderIndex: integer("order_index").notNull(),
  isLocked: boolean("is_locked").default(true).notNull(),
});

export const problems = pgTable("problems", {
  id: serial("id").primaryKey(),
  lessonId: integer("lesson_id").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  difficulty: text("difficulty").notNull(), // "easy", "medium", "hard"
  orderIndex: integer("order_index").notNull(),
  starterCode: text("starter_code").notNull(),
  solution: text("solution").notNull(),
  testCases: jsonb("test_cases").notNull(),
  hints: jsonb("hints").notNull(),
  xpReward: integer("xp_reward").default(50).notNull(),
  // NEW: Research Framework Fields
  researchTopics: jsonb("research_topics"), // Array of research topics/concepts
  learningObjectives: jsonb("learning_objectives"), // Array of learning goals
  professionalContext: text("professional_context"), // Why this matters professionally
  businessCategory: text("business_category"), // E.g., "fintech", "e-commerce", "saas"
});

export const userProgress = pgTable("user_progress", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),     // ← Change from integer to text
  problemId: integer("problem_id").notNull(),
  isCompleted: boolean("is_completed").default(false).notNull(),
  attempts: integer("attempts").default(0).notNull(),
  bestTime: integer("best_time"), // in seconds
  hintsUsed: integer("hints_used").default(0).notNull(),
  completedAt: timestamp("completed_at"),
  lastAttemptAt: timestamp("last_attempt_at").defaultNow().notNull(),
});

export const codeSubmissions = pgTable("code_submissions", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),     // ← Change from integer to text
  problemId: integer("problem_id").notNull(),
  code: text("code").notNull(),
  isCorrect: boolean("is_correct").notNull(),
  executionTime: integer("execution_time"), // in milliseconds
  output: text("output"),
  error: text("error"),
  submittedAt: timestamp("submitted_at").defaultNow().notNull(),
});

export const achievements = pgTable("achievements", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),     // ← Change from integer to text
  type: text("type").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  icon: text("icon").notNull(),
  earnedAt: timestamp("earned_at").defaultNow().notNull(),
});

// Relations
export const sectionsRelations = relations(sections, ({ many }) => ({
  lessons: many(lessons),
}));

export const lessonsRelations = relations(lessons, ({ one, many }) => ({
  section: one(sections, { fields: [lessons.sectionId], references: [sections.id] }),
  problems: many(problems),
}));

export const problemsRelations = relations(problems, ({ one }) => ({
  lesson: one(lessons, { fields: [problems.lessonId], references: [lessons.id] }),
}));

export const userProgressRelations = relations(userProgress, ({ one }) => ({
  user: one(users, { fields: [userProgress.userId], references: [users.id] }),
  problem: one(problems, { fields: [userProgress.problemId], references: [problems.id] }),
}));

export const achievementsRelations = relations(achievements, ({ one }) => ({
  user: one(users, { fields: [achievements.userId], references: [users.id] }),
}));

export const codeSubmissionsRelations = relations(codeSubmissions, ({ one }) => ({
  user: one(users, { fields: [codeSubmissions.userId], references: [users.id] }),
  problem: one(problems, { fields: [codeSubmissions.problemId], references: [problems.id] }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  currentStreak: true,
  totalProblems: true,
  totalXp: true,
  currentSection: true,
  currentLesson: true,
});

export const insertProblemSchema = createInsertSchema(problems).omit({
  id: true,
});

export const insertUserProgressSchema = createInsertSchema(userProgress).omit({
  id: true,
  lastAttemptAt: true,
});

export const insertCodeSubmissionSchema = createInsertSchema(codeSubmissions).omit({
  id: true,
  submittedAt: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Section = typeof sections.$inferSelect;
export type Lesson = typeof lessons.$inferSelect;
export type Problem = typeof problems.$inferSelect;
export type InsertProblem = z.infer<typeof insertProblemSchema>;
export type UserProgress = typeof userProgress.$inferSelect;
export type InsertUserProgress = z.infer<typeof insertUserProgressSchema>;
export type CodeSubmission = typeof codeSubmissions.$inferSelect;
export type InsertCodeSubmission = z.infer<typeof insertCodeSubmissionSchema>;
export type Achievement = typeof achievements.$inferSelect;

// Enhanced Problem type for research framework
export type EnhancedProblem = Problem & {
  researchTopics?: string[];
  learningObjectives?: string[];
  professionalContext?: string;
  businessCategory?: string;
};

// API Response types
export type ProblemWithProgress = Problem & {
  isCompleted: boolean;
  attempts: number;
  bestTime?: number;
  // Add research framework fields to API responses
  researchTopics?: string[];
  learningObjectives?: string[];
  professionalContext?: string;
  businessCategory?: string;
};

export type LessonWithProblems = Lesson & {
  problems: ProblemWithProgress[];
  completedProblems: number;
  totalProblems: number;
};

export type SectionWithLessons = Section & {
  lessons: LessonWithProblems[];
  completedLessons: number;
  totalLessons: number;
};

export type UserDashboard = {
  user: User;
  currentProblem?: Problem;
  sections: SectionWithLessons[];
  recentAchievements: Achievement[];
  stats: {
    progressPercentage: number;
    problemsSolved: number;
    currentStreak: number;
    totalXp: number;
  };
};

// Research Framework Utilities
export type ResearchTopic = {
  concept: string;
  description: string;
  documentation_link?: string;
};

export type LearningObjective = {
  skill: string;
  description: string;
  professional_relevance: string;
};

export type BusinessContext = {
  industry: string;
  use_case: string;
  companies_using: string[];
  why_it_matters: string;
};