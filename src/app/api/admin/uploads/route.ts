import { ConvexHttpClient } from "convex/browser";
import { anyApi } from "convex/server";
import { NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/api-auth";

const api = anyApi;

function getConvexClient() {
  const deploymentUrl =
    process.env.NEXT_PUBLIC_CONVEX_URL ?? process.env.NEXT_CONVEX_PUBLIC_URL;
  if (!deploymentUrl) {
    throw new Error("Persistence is unavailable. Set NEXT_PUBLIC_CONVEX_URL in Vercel and redeploy.");
  }

  return new ConvexHttpClient(deploymentUrl);
}

export async function POST(request: Request) {
  const isAdmin = await isAdminRequest();
  if (!isAdmin) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Image file is required." }, { status: 400 });
    }

    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "Only image uploads are supported." }, { status: 400 });
    }

    const client = getConvexClient();
    const uploadUrl = await client.mutation(api.content.generateUploadUrl, {});
    const uploadResponse = await fetch(uploadUrl, {
      method: "POST",
      headers: {
        "Content-Type": file.type || "application/octet-stream",
      },
      body: file,
    });

    if (!uploadResponse.ok) {
      throw new Error("Failed to upload image.");
    }

    const uploadResult = (await uploadResponse.json()) as { storageId?: string };
    if (!uploadResult.storageId) {
      throw new Error("Upload succeeded but no storage ID was returned.");
    }

    const url = await client.query(api.content.getStorageUrl, {
      storageId: uploadResult.storageId,
    });

    if (!url) {
      throw new Error("Image uploaded but URL could not be generated.");
    }

    return NextResponse.json({ url });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unable to upload image.",
      },
      { status: 500 },
    );
  }
}
