-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'MANAGER', 'EDITOR', 'USER');

-- CreateEnum
CREATE TYPE "BookingStatus" AS ENUM ('PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PAID', 'PARTIAL', 'REFUNDED', 'FAILED');

-- CreateTable
CREATE TABLE "regions" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "title" TEXT,
    "slug" TEXT,
    "description" TEXT,
    "code" TEXT,
    "metaTitle" TEXT,
    "metaKeywords" TEXT,
    "metaDescription" TEXT,
    "imageUrl" TEXT,
    "imageAlt" TEXT,
    "imageTitle" TEXT,
    "sitemapChangefreq" TEXT DEFAULT 'monthly',
    "sitemapPriority" DOUBLE PRECISION DEFAULT 0.5,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "hideInHome" BOOLEAN NOT NULL DEFAULT false,
    "hideInSitemap" BOOLEAN NOT NULL DEFAULT false,
    "hideInMenu" BOOLEAN NOT NULL DEFAULT false,
    "hideInSubMenu" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER DEFAULT 0,
    "iconUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "regions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "destinations" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "title" TEXT,
    "destinationTitle" TEXT,
    "slug" TEXT,
    "description" TEXT,
    "body" TEXT,
    "country" TEXT NOT NULL,
    "city" TEXT,
    "coordinates" TEXT,
    "metaTitle" TEXT,
    "metaKeywords" TEXT,
    "metaDescription" TEXT,
    "imageUrl" TEXT,
    "imageAlt" TEXT,
    "imageTitle" TEXT,
    "sitemapChangefreq" TEXT DEFAULT 'monthly',
    "sitemapPriority" DOUBLE PRECISION DEFAULT 0.5,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "hideInHome" BOOLEAN NOT NULL DEFAULT false,
    "hideInSitemap" BOOLEAN NOT NULL DEFAULT false,
    "hideInMenu" BOOLEAN NOT NULL DEFAULT false,
    "hideInSubMenu" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "regionId" TEXT NOT NULL,

    CONSTRAINT "destinations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tours" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "slug" TEXT,
    "shortDescription" TEXT,
    "duration" INTEGER NOT NULL,
    "maxGroupSize" INTEGER,
    "price" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "includes" TEXT[],
    "excludes" TEXT[],
    "itinerary" JSONB,
    "images" TEXT[],
    "tourType" TEXT,
    "groupType" TEXT,
    "tourCode" TEXT,
    "tourLanguage" TEXT,
    "airportPickup" BOOLEAN DEFAULT false,
    "visaIncluded" BOOLEAN DEFAULT false,
    "accommodation" TEXT,
    "transportType" TEXT,
    "guideIncluded" BOOLEAN DEFAULT false,
    "minAge" INTEGER,
    "maxAge" INTEGER,
    "cancellationPolicy" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "availableFrom" TIMESTAMP(3),
    "availableTo" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "regionId" TEXT NOT NULL,
    "destinationId" TEXT NOT NULL,
    "hotelId" TEXT NOT NULL,

    CONSTRAINT "tours_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bookings" (
    "id" TEXT NOT NULL,
    "bookingNumber" TEXT NOT NULL,
    "customerName" TEXT NOT NULL,
    "customerEmail" TEXT NOT NULL,
    "customerPhone" TEXT,
    "numberOfPeople" INTEGER NOT NULL,
    "totalAmount" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "bookingDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "travelDate" TIMESTAMP(3) NOT NULL,
    "status" "BookingStatus" NOT NULL DEFAULT 'PENDING',
    "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "specialRequests" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "tourId" TEXT NOT NULL,

    CONSTRAINT "bookings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hotels" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "slug" TEXT,
    "link" TEXT,
    "imageUrl" TEXT,
    "imageAlt" TEXT,
    "imageTitle" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "regionId" TEXT NOT NULL,
    "destinationId" TEXT NOT NULL,

    CONSTRAINT "hotels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "blogs" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT,
    "content" TEXT,
    "imageUrl" TEXT,
    "imageAlt" TEXT,
    "imageTitle" TEXT,
    "author" TEXT,
    "publishedAt" TIMESTAMP(3),
    "metaTitle" TEXT,
    "metaKeywords" TEXT,
    "metaDescription" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "regionId" TEXT NOT NULL,
    "destinationId" TEXT NOT NULL,

    CONSTRAINT "blogs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wikis" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT,
    "content" TEXT,
    "imageUrl" TEXT,
    "imageAlt" TEXT,
    "imageTitle" TEXT,
    "author" TEXT,
    "publishedAt" TIMESTAMP(3),
    "metaTitle" TEXT,
    "metaKeywords" TEXT,
    "metaDescription" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "regionId" TEXT NOT NULL,
    "destinationId" TEXT NOT NULL,

    CONSTRAINT "wikis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "faqs" (
    "id" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "imageUrl" TEXT,
    "imageAlt" TEXT,
    "imageTitle" TEXT,
    "author" TEXT,
    "publishedAt" TIMESTAMP(3),
    "metaTitle" TEXT,
    "metaKeywords" TEXT,
    "metaDescription" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "regionId" TEXT NOT NULL,
    "destinationId" TEXT NOT NULL,

    CONSTRAINT "faqs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reviews" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "imageUrl" TEXT,
    "imageAlt" TEXT,
    "imageTitle" TEXT,
    "author" TEXT,
    "publishedAt" TIMESTAMP(3),
    "metaTitle" TEXT,
    "metaKeywords" TEXT,
    "metaDescription" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pages" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT,
    "content" TEXT,
    "imageUrl" TEXT,
    "imageAlt" TEXT,
    "imageTitle" TEXT,
    "author" TEXT,
    "publishedAt" TIMESTAMP(3),
    "metaTitle" TEXT,
    "metaKeywords" TEXT,
    "metaDescription" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'USER',
    "imageUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "regions_name_key" ON "regions"("name");

-- CreateIndex
CREATE UNIQUE INDEX "regions_slug_key" ON "regions"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "regions_code_key" ON "regions"("code");

-- CreateIndex
CREATE UNIQUE INDEX "destinations_slug_key" ON "destinations"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "tours_slug_key" ON "tours"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "tours_tourCode_key" ON "tours"("tourCode");

-- CreateIndex
CREATE UNIQUE INDEX "bookings_bookingNumber_key" ON "bookings"("bookingNumber");

-- CreateIndex
CREATE UNIQUE INDEX "hotels_slug_key" ON "hotels"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "blogs_slug_key" ON "blogs"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "wikis_slug_key" ON "wikis"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "pages_slug_key" ON "pages"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- AddForeignKey
ALTER TABLE "destinations" ADD CONSTRAINT "destinations_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "regions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tours" ADD CONSTRAINT "tours_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "regions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tours" ADD CONSTRAINT "tours_destinationId_fkey" FOREIGN KEY ("destinationId") REFERENCES "destinations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tours" ADD CONSTRAINT "tours_hotelId_fkey" FOREIGN KEY ("hotelId") REFERENCES "hotels"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_tourId_fkey" FOREIGN KEY ("tourId") REFERENCES "tours"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "faqs" ADD CONSTRAINT "faqs_destinationId_fkey" FOREIGN KEY ("destinationId") REFERENCES "destinations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
