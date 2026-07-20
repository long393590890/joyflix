'use client';

import { useEffect, useState } from 'react';

type NavigatorWithUserAgentData = Navigator & {
  userAgentData?: {
    platform?: string;
  };
};

export function useIsAndroid(): boolean | null {
  const [isAndroid, setIsAndroid] = useState<boolean | null>(null);

  useEffect(() => {
    const browserNavigator = navigator as NavigatorWithUserAgentData;

    setIsAndroid(
      browserNavigator.userAgentData?.platform === 'Android' ||
        /Android/i.test(browserNavigator.userAgent)
    );
  }, []);

  return isAndroid;
}
