import { apiRequest } from "./api";

export type NewsletterSource = "Footer" | "Blog" | "Landing" | "Popup";

export async function subscribeToNewsletter(email: string, source: NewsletterSource) {
  const normalizedEmail = email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    throw new Error("Enter a valid email address.");
  }

  try {
    await apiRequest("/news/subscribe", {
      method: "POST",
      body: {
        emailAddress: normalizedEmail,
        source,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Subscription failed.";
    if (/already subscribed/i.test(message)) {
      return { alreadySubscribed: true };
    }
    throw error;
  }

  return { alreadySubscribed: false };
}
