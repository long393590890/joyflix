import { RotateCcw } from 'lucide-react';

import PageLayout from '@/components/PageLayout';

type AdminLoadErrorProps = {
  title: string;
  message: string;
  onRetry: () => void;
};

export default function AdminLoadError({
  title,
  message,
  onRetry,
}: AdminLoadErrorProps) {
  return (
    <PageLayout>
      <div className='p-4 sm:mt-8 sm:p-6'>
        <h1 className='mb-8 text-3xl font-bold text-gray-900 dark:text-gray-100'>
          {title}
        </h1>
        <div className='flex min-h-72 flex-col items-center justify-center rounded-lg border border-red-200 bg-red-50/70 px-6 text-center dark:border-red-900 dark:bg-red-950/20'>
          <h2 className='text-lg font-semibold text-red-700 dark:text-red-300'>
            配置加载失败
          </h2>
          <p className='mt-2 max-w-xl text-sm text-red-600 dark:text-red-400'>
            {message}
          </p>
          <button
            type='button'
            onClick={onRetry}
            className='mt-5 inline-flex items-center gap-2 rounded-lg bg-blue-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-600'
          >
            <RotateCcw className='h-4 w-4' />
            重新加载
          </button>
        </div>
      </div>
    </PageLayout>
  );
}
