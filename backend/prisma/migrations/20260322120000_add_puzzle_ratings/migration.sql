-- Add avg_rating and rating_count to puzzles
ALTER TABLE "puzzles" ADD COLUMN "avg_rating" DOUBLE PRECISION DEFAULT 0;
ALTER TABLE "puzzles" ADD COLUMN "rating_count" INTEGER NOT NULL DEFAULT 0;

-- Create puzzle_ratings table
CREATE TABLE "puzzle_ratings" (
    "id" SERIAL NOT NULL,
    "puzzle_id" INTEGER NOT NULL,
    "user_id" BIGINT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" VARCHAR(200),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "puzzle_ratings_pkey" PRIMARY KEY ("id")
);

-- Unique constraint: one rating per user per puzzle
CREATE UNIQUE INDEX "puzzle_ratings_puzzle_id_user_id_key" ON "puzzle_ratings"("puzzle_id", "user_id");

-- Foreign keys
ALTER TABLE "puzzle_ratings" ADD CONSTRAINT "puzzle_ratings_puzzle_id_fkey"
    FOREIGN KEY ("puzzle_id") REFERENCES "puzzles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "puzzle_ratings" ADD CONSTRAINT "puzzle_ratings_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
