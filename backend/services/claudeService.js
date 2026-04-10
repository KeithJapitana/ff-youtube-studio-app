const Anthropic = require("@anthropic-ai/sdk");
const { parseAIResponse } = require("../utils/parseAIResponse");

function buildPrompt({ videoAbout, clientContext, transcript }) {
  return `You are an expert YouTube content strategist for FranchiseFilming, a video production company specializing in franchise storytelling. Create engaging YouTube content that showcases our expertise and generates leads.

Deliverables:
1. 3 Title Options (SEO-optimized for YouTube)
2. Complete YouTube Description (SEO optimized, include placeholder timestamps, 3-5 key points, subtle CTA to contact FranchiseFilming)
3. Tags (15-20 tags as an array)
4. 3 Thumbnail Text Hooks

Guidelines:
- Write from FranchiseFilming's perspective
- Focus on value and insights, NOT summaries of the video
- Optimize for YouTube SEO and discoverability
- Target franchise owners/operators as primary audience
- Generate interest in our video production services
- Do NOT reiterate or summarize the transcript

Thumbnail Hook Format:
- Each hook = heading + subheading (two separate lines)
- Heading: the main click-worthy hook (numbers, secrets, emotional triggers)
- Subheading: Brand context — "FranchiseFilming [Video Type]"
- Examples:
  - heading: "Coco's Secret to 5,000+ Locations"
    subheading: "Inside Coco Bubble Tea's Global Franchise Strategy"
  - heading: "This is What Every Franchise Event Should Feel Like"
    subheading: "Ivy Kids Conference Reel"
  - heading: "I haven't missed any part of their life."
    subheading: "Ducklings Franchisee Story"

Video Context:
- What the video is about: ${videoAbout}
- Client/industry context: ${clientContext}

Video Transcript:
${transcript}

Respond ONLY with a valid JSON object. No markdown, no backticks, no extra text. Use this exact shape:
{
  "titles": ["title1", "title2", "title3"],
  "description": "full YouTube description here",
  "tags": ["tag1", "tag2", "tag3"],
  "hooks": [
    { "heading": "...", "subheading": "..." },
    { "heading": "...", "subheading": "..." },
    { "heading": "...", "subheading": "..." }
  ]
}`;
}

async function generateYouTubeContent({ apiKey, provider, baseUrl, videoAbout, clientContext, transcript }) {
  // Build Anthropic client options
  const clientOptions = { apiKey };

  // If a custom base URL is provided (e.g. Yuxor proxy), use it
  if (baseUrl && provider !== "anthropic") {
    clientOptions.baseURL = baseUrl;
  }

  const client = new Anthropic(clientOptions);

  const message = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1500,
    messages: [
      {
        role: "user",
        content: buildPrompt({ videoAbout, clientContext, transcript }),
      },
    ],
  });

  const rawText = message.content[0].text;
  return parseAIResponse(rawText);
}

module.exports = { generateYouTubeContent };
