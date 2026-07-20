/* eslint-disable @typescript-eslint/no-explicit-any,no-console */

import { getConfig } from '@/lib/config';
import { searchFromApi } from '@/lib/downstream';
import {
  isSiteCircuitOpenError,
  mapWithConcurrency,
  SEARCH_SITE_CONCURRENCY,
  withSiteCircuitBreaker,
  withTimeout,
} from '@/lib/search-resilience';
import { SearchResult } from '@/lib/types';

export const runtime = 'edge';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');

  if (!query) {
    return new Response(JSON.stringify({ results: [] }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const config = await getConfig();
  const apiSites = config.SourceConfig.filter((site) => !site.disabled);
  const cacheTime = config.SiteConfig.SiteInterfaceCacheTime || 7200;

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();

      const processSite = async (site: (typeof apiSites)[0]) => {
        try {
          const results: SearchResult[] = await withSiteCircuitBreaker(
            site.key,
            () =>
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

          if (results && results.length > 0) {
            const chunk = encoder.encode(JSON.stringify(results) + '\n');
            controller.enqueue(chunk);
          }
        } catch (err: any) {
          if (!isSiteCircuitOpenError(err)) {
            console.warn(`搜索失败 ${site.name}:`, err.message);
          }
        }
      };

      await mapWithConcurrency(
        apiSites,
        SEARCH_SITE_CONCURRENCY,
        processSite
      );
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'application/octet-stream',
      'Cache-Control': `public, max-age=${cacheTime}, s-maxage=${cacheTime}`,
      'CDN-Cache-Control': `public, s-maxage=${cacheTime}`,
      'Vercel-CDN-Cache-Control': `public, s-maxage=${cacheTime}`,
    },
  });
}
