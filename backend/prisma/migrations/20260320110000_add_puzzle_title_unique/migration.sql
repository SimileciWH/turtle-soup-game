-- AlterTable: add unique constraint on puzzles.title
CREATE UNIQUE INDEX IF NOT EXISTS "puzzles_title_key" ON "puzzles"("title");
