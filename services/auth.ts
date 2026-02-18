import { Role } from "../types";

const API_URL = "https://agrii-4fcm.onrender.com/api/auth";

export const signupUser = async (data: {
  name: string;
  phone: string;
  password: string;
}) => {
  const res = await fetch(`${API_URL}/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.json();
};

export const loginUser = async (data: {
  phone: string;
  password: string;
}) => {
  const res = await fetch(`${API_URL}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.json();
};

export const updateUserRole = async (data: {
  userId: string;
  role: Role;
}) => {
  // 🔒 SAFETY CHECK (THIS FIXES THE ERROR)
  if (!data.role) {
    throw new Error("Role cannot be null");
  }

  const res = await fetch(`${API_URL}/update-role`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      userId: data.userId,
      role: data.role, // now guaranteed to be string
    }),
  });

  return res.json();
};
