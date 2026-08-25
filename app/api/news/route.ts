import { NextResponse } from 'next/server';
import Parser from 'rss-parser';
import Sentiment from 'sentiment';
import fs from 'fs';
import path from 'path';

const sentiment = new Sentiment();

let cachedGeoJson: any = null;

async function getCachedGeoJson() {
  if (!cachedGeoJson) {
    const filePath = path.join(process.cwd(), 'public', 'countries.geojson');
    const fileContents = fs.readFileSync(filePath, 'utf8');
    cachedGeoJson = JSON.parse(fileContents);
  }
  return cachedGeoJson;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const country = searchParams.get('country');
  const category = searchParams.get('category') || 'General';

  if (!country) {
    return NextResponse.json({ error: 'Country is required' }, { status: 400 });
  }

  try {
    const parser = new Parser();
    const query = encodeURIComponent(`${country} ${category === 'general' ? 'News' : category} when:2d`);
    const feedUrl = `https://news.google.com/rss/search?q=${query}&hl=en-US&gl=US&ceid=US:en`;
    
    const feed = await parser.parseURL(feedUrl);
    const geoData = await getCachedGeoJson();
    
    // Build a quick lookup of country names
    const countryLookups = geoData.features.map((f: any) => ({
      name: f.properties.ADMIN || f.properties.NAME
    })).filter((c: any) => c.name && c.name.toLowerCase() !== country.toLowerCase());

    const mentionsSet = new Set<string>();

    const articles = feed.items.slice(0, 10).map((item: any) => {
      let title = item.title || "";
      let sourceName = "Google News";
      
      const titleParts = title.split(" - ");
      if (titleParts.length > 1) {
        sourceName = titleParts.pop() || sourceName;
        title = titleParts.join(" - ");
      }

      const desc = item.contentSnippet || "";
      const fullText = `${title} ${desc}`.toLowerCase();

      // Analyze sentiment
      const sentimentResult = sentiment.analyze(fullText);
      const sentimentScore = sentimentResult.score;

      // Scan for mentions
      const articleMentionsSet = new Set<string>();
      countryLookups.forEach((c: any) => {
        const regex = new RegExp(`\\b${c.name.toLowerCase()}\\b`, 'g');
        if (regex.test(fullText)) {
          mentionsSet.add(c.name);
          articleMentionsSet.add(c.name);
        }
      });

      return {
        title,
        description: desc,
        source: { name: sourceName },
        url: item.link,
        image: null,
        publishedAt: item.isoDate || item.pubDate || new Date().toISOString(),
        sentimentScore,
        mentions: Array.from(articleMentionsSet)
      };
    });

    return NextResponse.json({ 
      articles,
      mentions: Array.from(mentionsSet)
    });
  } catch (error) {
    console.error("RSS Parsing Error:", error);
    return NextResponse.json({
      articles: [
        {
          title: "Error Fetching Live News",
          description: "There was an error connecting to the live RSS feed.",
          source: { name: "System Message" },
          url: "#",
          image: null,
          publishedAt: new Date().toISOString()
        }
      ],
      mentions: []
    });
  }
}
