'use client';

import {
  createContext,
  Dispatch,
  ReactNode,
  SetStateAction,
  useContext,
  useRef,
  MutableRefObject,
  useEffect,
  useState,
} from 'react';

const SiteContext = createContext<{
  siteName: string;
  announcement?: string;
  mainContainerRef?: MutableRefObject<HTMLDivElement | null>;
  isTablet: boolean;
  isPreciseSearchEnabled: boolean;
  setIsPreciseSearchEnabled: Dispatch<SetStateAction<boolean>>;
  isSerialSpeedTest: boolean;
  setIsSerialSpeedTest: Dispatch<SetStateAction<boolean>>;
}>({
  siteName: 'JoyFlix',
  announcement: '切勿分享本站，以维持使用体验哦 ʕ •ᴥ•ʔ～✰✰',
  mainContainerRef: undefined,
  isTablet: false,
  isPreciseSearchEnabled: false,
  setIsPreciseSearchEnabled: () => {},
  isSerialSpeedTest: false,
  setIsSerialSpeedTest: () => {},
});

export const useSite = () => useContext(SiteContext);

export function SiteProvider({
  children,
  siteName,
  announcement,
}: {
  children: ReactNode;
  siteName: string;
  announcement?: string;
}) {
  const mainContainerRef = useRef<HTMLDivElement | null>(null);
  const [isTablet, setIsTablet] = useState(false);
  const [isPreciseSearchEnabled, setIsPreciseSearchEnabled] =
    useState<boolean>(() => {
      if (typeof window === 'undefined') return false;
      return localStorage.getItem('enablePreciseSearch') === 'true';
    });
  const [isSerialSpeedTest, setIsSerialSpeedTest] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('isSerialSpeedTest');
      if (saved !== null) {
        try {
          return JSON.parse(saved);
        } catch {
          // ignore parse error, return default
        }
      }
    }
    return false; // Default value if nothing in localStorage or parse fails
  });

  useEffect(() => {
    const checkDevice = () => {
      const userAgent = navigator.userAgent;
      const hasTouch =
        'ontouchstart' in window || navigator.maxTouchPoints > 0;
      setIsTablet(
        /(ipad|tablet|(android(?!.*mobile))|(windows(?!.*phone)(.*touch))|((macintosh.*(?!mobile).*safari.*(?!iphone|ipod))))/i.test(
          userAgent
        ) && hasTouch
      );
    };

    checkDevice();
    window.addEventListener('resize', checkDevice);
    return () => window.removeEventListener('resize', checkDevice);
  }, []);

  return (
    <SiteContext.Provider
      value={{
        siteName,
        announcement,
        mainContainerRef,
        isTablet,
        isPreciseSearchEnabled,
        setIsPreciseSearchEnabled,
        isSerialSpeedTest,
        setIsSerialSpeedTest,
      }}
    >
      {children}
    </SiteContext.Provider>
  );
}
