type PageLoadingSkeletonProps = {
  variant?: 'default' | 'detail' | 'play' | 'admin';
};

const PulseBlock = ({ className }: { className: string }) => (
  <div className={`animate-pulse rounded-lg bg-gray-200 dark:bg-gray-800 ${className}`} />
);

export default function PageLoadingSkeleton({
  variant = 'default',
}: PageLoadingSkeletonProps) {
  if (variant === 'detail') {
    return (
      <div className='min-h-screen w-full bg-white pb-20 text-gray-900 dark:bg-black dark:text-gray-200'>
        <div className='mx-auto max-w-[96%] px-4 py-8 sm:px-10'>
          <div className='grid grid-cols-1 gap-8 md:grid-cols-3 lg:grid-cols-4'>
            <PulseBlock className='aspect-[2/3] w-full md:col-span-1' />
            <div className='space-y-5 md:col-span-2 lg:col-span-3'>
              <PulseBlock className='h-10 w-2/3' />
              <div className='flex gap-3'>
                <PulseBlock className='h-6 w-16' />
                <PulseBlock className='h-6 w-24' />
                <PulseBlock className='h-6 w-20' />
              </div>
              <div className='flex gap-4'>
                <PulseBlock className='h-14 w-36' />
                <PulseBlock className='h-14 w-28' />
              </div>
              <div className='space-y-3 pt-2'>
                <PulseBlock className='h-4 w-full' />
                <PulseBlock className='h-4 w-11/12' />
                <PulseBlock className='h-4 w-4/5' />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (variant === 'play') {
    return (
      <div className='min-h-screen w-full bg-white pb-20 text-gray-900 dark:bg-black dark:text-gray-200'>
        <div className='flex flex-col gap-4 px-5 py-4 lg:px-12'>
          <PulseBlock className='h-7 w-56' />
          <div className='grid grid-cols-1 gap-4 md:grid-cols-4 lg:h-[500px] xl:h-[650px]'>
            <PulseBlock className='h-[300px] md:col-span-3 lg:h-full' />
            <PulseBlock className='h-[300px] md:col-span-1 lg:h-full' />
          </div>
          <PulseBlock className='h-36 w-full' />
        </div>
      </div>
    );
  }

  if (variant === 'admin') {
    return (
      <div className='min-h-screen w-full bg-white pb-20 text-gray-900 dark:bg-black dark:text-gray-200'>
        <div className='p-4 sm:mt-8 sm:p-6'>
          <PulseBlock className='mb-8 h-9 w-48' />
          <div className='grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4'>
            {Array.from({ length: 3 }).map((_, index) => (
              <PulseBlock key={index} className='h-48 w-full' />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen w-full bg-white pb-20 text-gray-900 dark:bg-black dark:text-gray-200'>
      <div className='mx-auto max-w-[96%] px-4 py-8 sm:px-10'>
        <PulseBlock className='mb-8 h-10 w-56' />
        <div className='grid grid-cols-3 gap-x-2 gap-y-14 sm:grid-cols-[repeat(auto-fill,minmax(11rem,1fr))] sm:gap-x-8'>
          {Array.from({ length: 12 }).map((_, index) => (
            <PulseBlock key={index} className='aspect-[2/3] w-full' />
          ))}
        </div>
      </div>
    </div>
  );
}
