// Mock responses for testing
interface MockResponse {
  id: string;
  form_id: string;
  field_data: Array<{
    name: string;
    values: string[];
  }>;
  created_time: string;
  page_id: string;
}

const mockResponses: Record<string, MockResponse> = {};

export function setMockFacebookResponse(
  leadId: string,
  mockData: MockResponse
) {
  mockResponses[leadId] = mockData;
}

export function clearMockFacebookResponses() {
  Object.keys(mockResponses).forEach((key) => delete mockResponses[key]);
}

export async function getFacebookFormData(leadId: string) {
  // Check for mock response during testing
  if (mockResponses[leadId]) {
    console.log("📝 Using mock Facebook API response for testing:", leadId);
    const mockResponse = mockResponses[leadId];

    // Clean up after use
    delete mockResponses[leadId];

    return mockResponse;
  }

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
