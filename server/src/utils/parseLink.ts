/**
 * Parses a URL to extract title and description from HTML content
 * @param url - The URL to fetch and parse
 * @returns Object with title and description, using the URL as fallback for missing values
 */
export async function parseLink(url: string): Promise<{
  title: string;
  description: string;
}> {
  try {
    // Validate URL
    new URL(url);
  } catch {
    return { title: url, description: url };
  }

  try {
    // Fetch the HTML content
    const response = await fetch(url, {
      // Set a reasonable timeout
      signal: AbortSignal.timeout(10000), // 10 seconds
    });

    if (!response.ok) {
      return { title: url, description: url };
    }

    const html = await response.text();

    // Extract title
    const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim() : url;

    // Extract description from meta tags
    const descriptionMatch = html.match(
      /<meta[^>]*(?:name|property)=["'](?:description|og:description|twitter:description)["'][^>]*content=["']([^"']*)["'][^>]*>/i,
    );
    const description = descriptionMatch ? descriptionMatch[1].trim() : url;

    return {
      title: title || url,
      description: description || url,
    };
  } catch {
    // Return URL for both values if any error occurs
    return { title: url, description: url };
  }
}
