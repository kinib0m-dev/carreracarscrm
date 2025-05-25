export async function getFacebookFormData(leadId: string) {
  const accessToken = process.env.FACEBOOK_ACCESS_TOKEN;

  if (!accessToken) {
    throw new Error("Facebook access token not configured");
  }

  const response = await fetch(
    `https://graph.facebook.com/v17.0/${leadId}?access_token=${accessToken}`
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Facebook API error: ${JSON.stringify(error)}`);
  }

  return await response.json();
}
