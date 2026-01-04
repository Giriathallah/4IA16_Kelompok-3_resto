import { NextResponse } from "next/server";
import { logOut } from "@/actions/auth";

export async function POST() {
  try {
    await logOut();
  } catch (error) {
    console.error("Logout failed:", error);
    return NextResponse.json(
      { message: "Failed to logout", error: (error as Error).message },
      { status: 500 }
    );
  }
}
