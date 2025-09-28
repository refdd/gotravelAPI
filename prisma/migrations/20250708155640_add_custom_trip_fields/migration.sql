-- AlterTable
ALTER TABLE "bookings" ADD COLUMN     "adults" INTEGER,
ADD COLUMN     "ageOfChildren" TEXT,
ADD COLUMN     "arrivalDate" TIMESTAMP(3),
ADD COLUMN     "children" INTEGER,
ADD COLUMN     "departureAirport" TEXT,
ADD COLUMN     "departureDate" TIMESTAMP(3),
ADD COLUMN     "flightIncluded" BOOLEAN,
ADD COLUMN     "httpReferer" TEXT,
ADD COLUMN     "nationality" TEXT,
ADD COLUMN     "requestSource" TEXT,
ADD COLUMN     "urlGoal" TEXT,
ADD COLUMN     "utmCampaign" TEXT,
ADD COLUMN     "utmContent" TEXT,
ADD COLUMN     "utmMedium" TEXT,
ADD COLUMN     "utmSource" TEXT,
ADD COLUMN     "utmTerm" TEXT,
ALTER COLUMN "tourId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "tours" ALTER COLUMN "hotelId" DROP NOT NULL;
