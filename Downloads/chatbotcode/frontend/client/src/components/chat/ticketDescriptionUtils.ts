// Utility to clean ticket descriptions and extract only the main issue.
// This removes email signatures, footers, and image references.

export function cleanTicketDescription(description: string): string {
  if (!description) return "";
  // Split into lines and trim whitespace
  const lines = description.split(/\r?\n/).map((l) => l.trim());
  // Remove empty lines
  const nonEmpty = lines.filter((l) => l.length > 0);
  if (nonEmpty.length === 0) return "";

  // Define keywords that indicate start of signature/footer/image
  const stopKeywords = [
    /^regards/i,
    /^cheers/i,
    /^thanks/i,
    /^best/i,
    /^sent from/i,
    /^email:/i,
    /@/,
    /www\./i,
    /http/i,
    /^\[cid:/i
  ];

  // Gather lines for the first paragraph (before any stop keyword)
  const paragraph: string[] = [];
  for (let i = 0; i < nonEmpty.length; i++) {
    const line = nonEmpty[i];
    // If the line matches any stop keyword, break
    if (stopKeywords.some((kw) => kw.test(line))) {
      break;
    }
    paragraph.push(line);
  }
  // Join lines with space if the paragraph is multi-line
  return paragraph.join(' ').trim();
}

// Utility to format ticket title and description for initial chatbot query
export function formatTicketForChat(title: string, description: string): string {
  const cleanedDescription = cleanTicketDescription(description);
  
  if (!title && !cleanedDescription) return "";
  if (!title) return cleanedDescription;
  if (!cleanedDescription) return title;
  
  // Format as: Title + line gap + Description
  // Use double newlines to ensure proper spacing in chat interface
  return `${title}\n\n${cleanedDescription}`;
}

