-- CreateTable
CREATE TABLE "socket_io_attachments" (
    "id" BIGSERIAL NOT NULL,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "payload" BYTEA,

    CONSTRAINT "socket_io_attachments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "socket_io_rooms" (
    "id" BIGSERIAL NOT NULL,
    "room" VARCHAR NOT NULL,
    "sid" VARCHAR NOT NULL,

    CONSTRAINT "socket_io_rooms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "socket_io_sessions" (
    "sid" VARCHAR NOT NULL,
    "sess" JSON NOT NULL,
    "expire" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "socket_io_sessions_pkey" PRIMARY KEY ("sid")
);

-- CreateIndex
CREATE INDEX "idx_rooms_room" ON "socket_io_rooms"("room");

-- CreateIndex
CREATE INDEX "idx_rooms_sid" ON "socket_io_rooms"("sid");

-- CreateIndex
CREATE UNIQUE INDEX "socket_io_rooms_room_sid_key" ON "socket_io_rooms"("room", "sid");

-- CreateIndex
CREATE INDEX "idx_sessions_expire" ON "socket_io_sessions"("expire");
