-- CreateEnum
CREATE TYPE "ChannelStatus" AS ENUM ('active', 'syncing');

-- CreateEnum
CREATE TYPE "TaskType" AS ENUM ('VIDEO_SYNC', 'CHANNEL_HOURLY', 'CHANNEL_DAILY', 'PUBSUB_NEW_VIDEO');

-- CreateTable
CREATE TABLE "channels" (
    "id" TEXT NOT NULL,
    "channel_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "thumbnail_url" TEXT,
    "status" "ChannelStatus" NOT NULL DEFAULT 'active',
    "country" TEXT,
    "custom_url" TEXT,
    "published_at" TIMESTAMP(3),
    "video_count" INTEGER,
    "view_count" BIGINT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "last_analytics_at" TIMESTAMP(3),
    "last_video_sync_at" TIMESTAMP(3),
    "total_views" BIGINT,
    "total_subscribers" BIGINT,
    "note" TEXT,

    CONSTRAINT "channels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "videos" (
    "id" TEXT NOT NULL,
    "video_id" TEXT NOT NULL,
    "channel_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "published_at" TIMESTAMP(3) NOT NULL,
    "live" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "videos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "video_stat_snapshots" (
    "id" TEXT NOT NULL,
    "video_id" TEXT NOT NULL,
    "channel_id" TEXT NOT NULL,
    "collected_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "view_count" BIGINT NOT NULL,
    "like_count" BIGINT NOT NULL,
    "comment_count" BIGINT NOT NULL,

    CONSTRAINT "video_stat_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "channel_daily_stats" (
    "id" TEXT NOT NULL,
    "channel_id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "views" BIGINT NOT NULL,
    "watch_time_hours" DOUBLE PRECISION NOT NULL,
    "subscribers_gained" INTEGER NOT NULL,
    "subscribers_lost" INTEGER NOT NULL,
    "estimated_minutes_watched" BIGINT NOT NULL,
    "impressions" BIGINT NOT NULL,
    "impression_ctr" DOUBLE PRECISION NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "channel_daily_stats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "task_logs" (
    "id" TEXT NOT NULL,
    "task_type" "TaskType" NOT NULL,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finished_at" TIMESTAMP(3),
    "success" BOOLEAN NOT NULL,
    "message" TEXT,
    "duration_ms" INTEGER,

    CONSTRAINT "task_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "channels_channel_id_key" ON "channels"("channel_id");

-- CreateIndex
CREATE INDEX "channels_status_idx" ON "channels"("status");

-- CreateIndex
CREATE INDEX "channels_title_idx" ON "channels"("title");

-- CreateIndex
CREATE INDEX "channels_total_views_idx" ON "channels"("total_views");

-- CreateIndex
CREATE INDEX "channels_total_subscribers_idx" ON "channels"("total_subscribers");

-- CreateIndex
CREATE UNIQUE INDEX "videos_video_id_key" ON "videos"("video_id");

-- CreateIndex
CREATE INDEX "videos_channel_id_idx" ON "videos"("channel_id");

-- CreateIndex
CREATE INDEX "videos_published_at_idx" ON "videos"("published_at");

-- CreateIndex
CREATE INDEX "videos_title_idx" ON "videos"("title");

-- CreateIndex
CREATE INDEX "video_stat_snapshots_channel_id_collected_at_idx" ON "video_stat_snapshots"("channel_id", "collected_at");

-- CreateIndex
CREATE INDEX "video_stat_snapshots_video_id_collected_at_idx" ON "video_stat_snapshots"("video_id", "collected_at");

-- CreateIndex
CREATE INDEX "video_stat_snapshots_view_count_idx" ON "video_stat_snapshots"("view_count");

-- CreateIndex
CREATE UNIQUE INDEX "video_stat_snapshots_video_id_collected_at_key" ON "video_stat_snapshots"("video_id", "collected_at");

-- CreateIndex
CREATE INDEX "channel_daily_stats_channel_id_date_idx" ON "channel_daily_stats"("channel_id", "date");

-- CreateIndex
CREATE INDEX "channel_daily_stats_views_idx" ON "channel_daily_stats"("views");

-- CreateIndex
CREATE INDEX "channel_daily_stats_subscribers_gained_idx" ON "channel_daily_stats"("subscribers_gained");

-- CreateIndex
CREATE UNIQUE INDEX "channel_daily_stats_channel_id_date_key" ON "channel_daily_stats"("channel_id", "date");

-- CreateIndex
CREATE INDEX "task_logs_task_type_idx" ON "task_logs"("task_type");

-- CreateIndex
CREATE INDEX "task_logs_started_at_idx" ON "task_logs"("started_at");

-- CreateIndex
CREATE INDEX "task_logs_success_idx" ON "task_logs"("success");

-- AddForeignKey
ALTER TABLE "videos" ADD CONSTRAINT "videos_channel_id_fkey" FOREIGN KEY ("channel_id") REFERENCES "channels"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "video_stat_snapshots" ADD CONSTRAINT "video_stat_snapshots_channel_id_fkey" FOREIGN KEY ("channel_id") REFERENCES "channels"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "video_stat_snapshots" ADD CONSTRAINT "video_stat_snapshots_video_id_fkey" FOREIGN KEY ("video_id") REFERENCES "videos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "channel_daily_stats" ADD CONSTRAINT "channel_daily_stats_channel_id_fkey" FOREIGN KEY ("channel_id") REFERENCES "channels"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
