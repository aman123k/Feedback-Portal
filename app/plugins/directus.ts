import {
  authentication,
  AuthenticationMode,
  createDirectus,
  createItem,
  createUser,
  deleteItem,
  DirectusUser,
  readItems,
  readMe,
  refresh,
  rest,
  updateItem,
} from "@directus/sdk";
import { createCookie } from "@remix-run/node";

const directusUrl = process.env.DIRECTUS_URL;
const COOKIES_SECRET = process.env.COOKIES_SECRET;

if (!directusUrl) {
  throw new Error("DIRECTUS_URL environment variable is required");
}
// User Interface
export interface User {
  id?: string;
  email: string;
  password?: string;
  first_name?: string;
  last_name?: string;
  role?: string;
  status?: string;
}

// Feedback Interface
export interface feedbacks {
  id?: string;
  title: string;
  description: string;
  category: "Bug" | "Feature" | "Other";
  status?: string;
  created_by?: { first_name: string; last_name: string };
  created_at?: string;
}

// Directus Schema
export interface DirectusSchema {
  feedbacks: feedbacks[];
  users: User[];
  directus_roles: {
    id: string;
    name: string;
  }[];
}
const directus = createDirectus<DirectusSchema>(directusUrl)
  .with(authentication("json"))
  .with(rest());

export default directus;

// LOGIN USER FUNCTION
export const userLogin = async (email: string, password: string) => {
  try {
    const user = await directus.login(email, password);
    return {
      success: true,
      user,
    };
  } catch (error) {
    console.error("Login failed:", error);
    throw error;
  }
};

// REFRESH TOKEN FUNCTION
export const refreshUserToken = async (token: string) => {
  try {
    const result = await directus.request(refresh(token as AuthenticationMode));
    return {
      success: true,
      user: {
        access_token: result.access_token,
        refresh_token: result.refresh_token,
      },
    };
  } catch (error) {
    console.error("Token refresh failed:", error);
    throw error;
  }
};

// REGISTER USER FUNCTION TO REGISTER USER IN DIRECTUS
export const registerUser = async (userData: User) => {
  try {
    const newUser = await directus.request(
      createUser({
        ...userData,
        status: "active",
      })
    );
    return newUser;
  } catch (error) {
    console.error("Error registering user:", error);
    throw error;
  }
};

// CHECK IF COOKIE_SECRET CODE
if (!COOKIES_SECRET) {
  throw new Error("COOKIES_SECRET environment variable is required");
}

// SET COOKIE FUNCTION
export const cookie = createCookie("auth", {
  path: "/",
  sameSite: "lax",
  httpOnly: true,
  secure: true,
  secrets: [COOKIES_SECRET],
  expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days for refresh token
  maxAge: 60 * 60,
});

// REFRESH TOKEN COOKIE
export const refreshCookie = createCookie("refresh", {
  path: "/",
  sameSite: "lax",
  httpOnly: true,
  secure: true,
  secrets: [COOKIES_SECRET],
  expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
  maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
});

// DELETE COOKIE FUNCTION
export const deleteCookie = createCookie("auth", {
  path: "/",
  sameSite: "lax",
  httpOnly: true,
  secure: true,
  secrets: [COOKIES_SECRET],
  expires: new Date(0),
  maxAge: 0,
});

// GET USER FROM DIRECTUS
export const getDirectusUser = async (token: string) => {
  try {
    directus.setToken(token);
    const user = await directus.request(
      readMe({
        fields: ["id", "email", "first_name", "last_name", "role"],
      })
    );
    return user as DirectusUser;
  } catch (error) {
    console.log("error while getting user", error);
    return null;
  }
};

// GET FEEDBACK FUNCTION
export const getFeedbackPost = async () => {
  try {
    const result = await directus.request(
      readItems("feedbacks", {
        fields: ["*.*"],
      })
    );
    return result;
  } catch (err) {
    console.log("while getting post", err);
    return null;
  }
};

//CREATE FEEDBACK FUNCTION
export const createFeedbackPost = async (feedback: feedbacks) => {
  try {
    const newFeedback = await directus.request(
      createItem("feedbacks", {
        ...feedback,
        status: "draft",
      })
    );
    return newFeedback;
  } catch (err) {
    console.log("while creating a post", err);
    return null;
  }
};

//UPDATE STATUS OF THE FEEDBACK POST
export const updateFeedbackPost = async (id: string, status: string) => {
  try {
    const updateFeedback = await directus.request(
      updateItem("feedbacks", id, { status })
    );
    return updateFeedback;
  } catch (err) {
    console.log("while updating a post", err);
    return null;
  }
};

//DELETE A PARTICULAR FEEDBACK
export const deleteFeedbackPost = async (id: string) => {
  try {
    const deleteFeedback = await directus.request(deleteItem("feedbacks", id));
    return deleteFeedback;
  } catch (err) {
    console.log("while delete a post", err);
    return null;
  }
};
