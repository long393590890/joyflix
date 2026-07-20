/* eslint-disable @typescript-eslint/no-explicit-any,no-console */

import { NextResponse } from 'next/server';

import { getConfig } from '@/lib/config';
import { searchFromApi } from '@/lib/downstream';
import {
  isSiteCircuitOpenError,
  mapWithConcurrency,
  SEARCH_SITE_CONCURRENCY,
  withSiteCircuitBreaker,
  withTimeout,
} from '@/lib/search-resilience';


export const runtime = 'edge';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');

  if (!query) {
    const cacheTime = 7200;
    return NextResponse.json(
      { results: [] },
      {
        headers: {
          'Cache-Control': `public, max-age=${cacheTime}, s-maxage=${cacheTime}`,
          'CDN-Cache-Control': `public, s-maxage=${cacheTime}`,
          'Vercel-CDN-Cache-Control': `public, s-maxage=${cacheTime}`,
          'Netlify-Vary': 'query',
        },
      }
    );
  }

  const config = await getConfig();
  const apiSites = config.SourceConfig.filter((site) => !site.disabled);
  try {
    const results = await mapWithConcurrency(
      apiSites,
      SEARCH_SITE_CONCURRENCY,
      async (site) => {
        try {
          return await withSiteCircuitBreaker(site.key, () =>
            withTimeout(
              searchFromApi(
                site,
                query,
                config.SiteConfig.SearchDownstreamMaxPage
              ),
              20000,
              `${site.name} timeout`
            )
          );
        } catch (error) {
          if (!isSiteCircuitOpenError(error)) {
            console.warn(
              `搜索失败 ${site.name}:`,
              error instanceof Error ? error.message : error
            );
          }
          return [];
        }
      }
    );
    const flattenedResults = results.flat();
    
    const cacheTime = config.SiteConfig.SiteInterfaceCacheTime || 7200;

    return NextResponse.json(
      { results: flattenedResults },
      {
        headers: {
          'Cache-Control': `public, max-age=${cacheTime}, s-maxage=${cacheTime}`,
          'CDN-Cache-Control': `public, s-maxage=${cacheTime}`,
          'Vercel-CDN-Cache-Control': `public, s-maxage=${cacheTime}`,
          'Netlify-Vary': 'query',
        },
      }
    );
  } catch (error) {
    return NextResponse.json({ error: '搜索失败' }, { status: 500 });
  }
}
