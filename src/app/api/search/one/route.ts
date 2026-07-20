import { NextResponse } from 'next/server';

import { getCacheTime, getConfig } from '@/lib/config';
import { searchFromApi } from '@/lib/downstream';
import {
  isSiteCircuitOpenError,
  withSiteCircuitBreaker,
  withTimeout,
} from '@/lib/search-resilience';


export const runtime = 'edge';

// OrionTV 兼容接口
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');
  const resourceId = searchParams.get('resourceId');

  if (!query || !resourceId) {
    const cacheTime = await getCacheTime();
    return NextResponse.json(
      { result: null, error: '缺少必要参数: q 或 resourceId' },
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
    // 根据 resourceId 查找对应的 API 站点
    const targetSite = apiSites.find((site) => site.key === resourceId);
    if (!targetSite) {
      return NextResponse.json(
        {
          error: `未找到指定的视频源: ${resourceId}`,
          result: null,
        },
        { status: 404 }
      );
    }

    const results = await withSiteCircuitBreaker(targetSite.key, () =>
      withTimeout(
        searchFromApi(targetSite, query),
        20000,
        `${targetSite.name} timeout`
      )
    );
    let result = results.filter((r) => r.title === query);
    
    const cacheTime = await getCacheTime();

    if (result.length === 0) {
      return NextResponse.json(
        {
          error: '未找到结果',
          result: null,
        },
        { status: 404 }
      );
    } else {
      return NextResponse.json(
        { results: result },
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
  } catch (error) {
    const circuitOpen = isSiteCircuitOpenError(error);
    return NextResponse.json(
      {
        error: circuitOpen ? '资源站暂时不可用，请稍后重试' : '搜索失败',
        result: null,
      },
      { status: circuitOpen ? 503 : 500 }
    );
  }
}
