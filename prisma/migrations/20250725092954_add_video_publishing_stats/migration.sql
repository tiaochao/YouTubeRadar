-- AlterTable
ALTER TABLE "channel_daily_stats" ADD COLUMN     "avg_views_per_video" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "total_video_views" BIGINT NOT NULL DEFAULT 0,
ADD COLUMN     "videos_published" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "videos_published_live" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX "channel_daily_stats_videos_published_idx" ON "channel_daily_stats"("videos_published");
