/*
  Warnings:

  - You are about to drop the column `current_players` on the `rooms` table. All the data in the column will be lost.
  - You are about to drop the column `password` on the `rooms` table. All the data in the column will be lost.
  - You are about to drop the column `game_id` on the `submissions` table. All the data in the column will be lost.
  - You are about to drop the column `avatar_url` on the `users` table. All the data in the column will be lost.
  - You are about to drop the `game_participants` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `games` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `leaderboards` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `room_id` to the `submissions` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "game_participants" DROP CONSTRAINT "game_participants_game_id_fkey";

-- DropForeignKey
ALTER TABLE "game_participants" DROP CONSTRAINT "game_participants_user_id_fkey";

-- DropForeignKey
ALTER TABLE "games" DROP CONSTRAINT "games_room_id_fkey";

-- DropForeignKey
ALTER TABLE "games" DROP CONSTRAINT "games_winner_id_fkey";

-- DropForeignKey
ALTER TABLE "leaderboards" DROP CONSTRAINT "leaderboards_game_id_fkey";

-- DropForeignKey
ALTER TABLE "leaderboards" DROP CONSTRAINT "leaderboards_user_id_fkey";

-- DropForeignKey
ALTER TABLE "submissions" DROP CONSTRAINT "submissions_game_id_fkey";

-- AlterTable
ALTER TABLE "rooms" DROP COLUMN "current_players",
DROP COLUMN "password",
ADD COLUMN     "challenge_description" TEXT,
ADD COLUMN     "challenge_examples" TEXT,
ADD COLUMN     "challenge_title" TEXT,
ADD COLUMN     "difficulty" TEXT DEFAULT 'medium',
ADD COLUMN     "duration_seconds" INTEGER,
ADD COLUMN     "ended_at" TIMESTAMP(3),
ADD COLUMN     "started_at" TIMESTAMP(3),
ADD COLUMN     "winner_id" TEXT;

-- AlterTable
ALTER TABLE "submissions" DROP COLUMN "game_id",
ADD COLUMN     "room_id" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "users" DROP COLUMN "avatar_url";

-- DropTable
DROP TABLE "game_participants";

-- DropTable
DROP TABLE "games";

-- DropTable
DROP TABLE "leaderboards";

-- AddForeignKey
ALTER TABLE "rooms" ADD CONSTRAINT "rooms_winner_id_fkey" FOREIGN KEY ("winner_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "rooms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
