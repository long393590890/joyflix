import { NextResponse } from 'next/server';

import { fetchDoubanData } from '@/lib/douban';
import { getUpstashRedisClient } from '@/lib/upstash.db';

const RECOMMENDATIONS_KEY = 'recommendations:movie_titles_cache';
const LAST_UPDATED_KEY = 'recommendations:last_updated';
const REFRESH_INTERVAL_MS = 7 * 24 * 60 * 60 * 1000;

let memoryRecommendations: string[] = [];
let memoryLastUpdated = 0;

export const dynamic = 'force-dynamic';

interface DoubanCategoryResponse {
  items?: Array<{ title?: string }>;
}

async function fetchRecommendationTitles(): Promise<string[]> {
  const data = await fetchDoubanData<DoubanCategoryResponse>(
    'https://m.douban.com/rexxar/api/v2/subject/recent_hot/movie?start=0&limit=50&category=热门&type=全部'
  );
  const movies = data.items || [];
  return Array.from(
    new Set(movies.map((movie) => movie.title).filter(Boolean) as string[])
  );
}

function selectRecommendations(titles: string[]): string[] {
  return [...titles].sort(() => 0.5 - Math.random()).slice(0, 6);
}

export async function GET() {
  const now = Date.now();
  const hasUpstash = Boolean(
    process.env.UPSTASH_URL && process.env.UPSTASH_TOKEN
  );

  try {
    if (!hasUpstash) {
      if (
        memoryRecommendations.length === 0 ||
        now - memoryLastUpdated > REFRESH_INTERVAL_MS
      ) {
        const freshTitles = await fetchRecommendationTitles();
        if (freshTitles.length > 0) {
          memoryRecommendations = freshTitles;
          memoryLastUpdated = now;
        }
      }
      return NextResponse.json({
        list: selectRecommendations(memoryRecommendations),
      });
    }

    const client = getUpstashRedisClient();
    const [lastUpdatedValue, cachedMoviesValue] = await Promise.all([
      client.get<number>(LAST_UPDATED_KEY),
      client.get<string>(RECOMMENDATIONS_KEY),
    ]);
    const cachedTitles =
      typeof cachedMoviesValue === 'string' && cachedMoviesValue
        ? cachedMoviesValue.split(',')
        : [];
    const lastUpdated =
      typeof lastUpdatedValue === 'number' ? lastUpdatedValue : 0;

    let recommendedMovies = cachedTitles;
    if (!lastUpdated || now - lastUpdated > REFRESH_INTERVAL_MS) {
      const freshTitles = await fetchRecommendationTitles();
      if (freshTitles.length > 0) {
        recommendedMovies = freshTitles;
        await Promise.all([
          client.set(RECOMMENDATIONS_KEY, freshTitles.join(',')),
          client.set(LAST_UPDATED_KEY, now),
        ]);
      }
    }

    return NextResponse.json({
      list: selectRecommendations(recommendedMovies),
    });
  } catch (error) {
    console.error('获取搜索推荐失败:', error);
    return NextResponse.json(
      { list: selectRecommendations(memoryRecommendations) },
      { status: memoryRecommendations.length > 0 ? 200 : 500 }
    );
  }
}
