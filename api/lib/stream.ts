import { StreamChat, Channel, ChannelFilters } from "stream-chat";

import dotenv from "dotenv";
dotenv.config();

if (!process.env.STREAM_API_KEY || !process.env.STREAM_API_SECRET) {
  throw new Error(
    "STREAM_API_KEY and STREAM_API_SECRET must be defined in the environment variables."
  );
}

const streamClient = StreamChat.getInstance(
  process.env.STREAM_API_KEY,
  process.env.STREAM_API_SECRET
);

// Define the user data interface based on Stream Chat's expected structure
interface StreamUserData {
  id: string;
  name?: string;
  image?: string;
  role?: string;
  online?: boolean;
  invisible?: boolean;
  language?: string;
  created_at?: string;
  updated_at?: string;
  last_active?: string;
  banned?: boolean;
  teams?: string[];
  [key: string]: any; // Allow additional custom properties
}

export const upsertStreamUser = async (
  userData: StreamUserData
): Promise<StreamUserData | undefined> => {
  try {
    await streamClient.upsertUser(userData);
    console.log("Stream user upserted successfully:", userData.name);
    return userData;
  } catch (error) {
    console.log("Error upserting Stream user:", error);
    return undefined;
  }
};

export const deleteStreamUser = async (userId: string): Promise<void> => {
  try {
    await streamClient.deleteUser(userId);
    console.log("Stream user deleted successfully:", userId);
  } catch (error) {
    console.error("Error deleting Stream user:", error);
  }
};

export const generateStreamToken = (userId: string | number): string | null => {
  try {
    const userIdString = userId.toString();
    return streamClient.createToken(userIdString);
  } catch (error) {
    console.log("Error generating Stream token:", error);
    return null;
  }
};

export const addUserToPublicChannels = async (
  newUserId: string
): Promise<void> => {
  try {
    if (!newUserId)
      throw new Error("User ID is required to add user to channels.");

    const filters: ChannelFilters = { type: "public" };
    const publicChannels = await streamClient.queryChannels(filters);

    for (const channel of publicChannels as Channel[]) {
      await channel.addMembers([newUserId]);
    }
    console.log(
      `Added user ${newUserId} to ${publicChannels.length} public channels.`
    );
  } catch (error) {
    console.error("Error adding user to public channels:", error);
  }
};
