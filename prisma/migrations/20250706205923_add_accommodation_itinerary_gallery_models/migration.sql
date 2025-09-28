-- CreateTable
CREATE TABLE "accommodations" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "image" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "accommodations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accommodation_prices" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "accommodationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "accommodation_prices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accommodation_price_items" (
    "id" TEXT NOT NULL,
    "priceValue" DECIMAL(10,2) NOT NULL,
    "body" TEXT NOT NULL,
    "sort" INTEGER NOT NULL,
    "priceId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "accommodation_price_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "itineraries" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT,
    "meals" TEXT,
    "accommodation" TEXT,
    "sort" INTEGER NOT NULL,
    "mediaUrl" TEXT,
    "mediaAlt" TEXT,
    "mediaTitle" TEXT,
    "tourId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "itineraries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "galleries" (
    "id" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "imageAlt" TEXT,
    "imageTitle" TEXT,
    "videoLink" TEXT,
    "tourId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "galleries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trip_information" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "tourId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "trip_information_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_AccommodationHotels" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_AccommodationHotels_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_TourAccommodations" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_TourAccommodations_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_AccommodationHotels_B_index" ON "_AccommodationHotels"("B");

-- CreateIndex
CREATE INDEX "_TourAccommodations_B_index" ON "_TourAccommodations"("B");

-- AddForeignKey
ALTER TABLE "accommodation_prices" ADD CONSTRAINT "accommodation_prices_accommodationId_fkey" FOREIGN KEY ("accommodationId") REFERENCES "accommodations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accommodation_price_items" ADD CONSTRAINT "accommodation_price_items_priceId_fkey" FOREIGN KEY ("priceId") REFERENCES "accommodation_prices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "itineraries" ADD CONSTRAINT "itineraries_tourId_fkey" FOREIGN KEY ("tourId") REFERENCES "tours"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "galleries" ADD CONSTRAINT "galleries_tourId_fkey" FOREIGN KEY ("tourId") REFERENCES "tours"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trip_information" ADD CONSTRAINT "trip_information_tourId_fkey" FOREIGN KEY ("tourId") REFERENCES "tours"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AccommodationHotels" ADD CONSTRAINT "_AccommodationHotels_A_fkey" FOREIGN KEY ("A") REFERENCES "accommodations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AccommodationHotels" ADD CONSTRAINT "_AccommodationHotels_B_fkey" FOREIGN KEY ("B") REFERENCES "hotels"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_TourAccommodations" ADD CONSTRAINT "_TourAccommodations_A_fkey" FOREIGN KEY ("A") REFERENCES "accommodations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_TourAccommodations" ADD CONSTRAINT "_TourAccommodations_B_fkey" FOREIGN KEY ("B") REFERENCES "tours"("id") ON DELETE CASCADE ON UPDATE CASCADE;
