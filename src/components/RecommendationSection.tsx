import React from 'react';
import VideoCard from './VideoCard';
import { Recommendation } from '@/lib/types';
import { useSite } from '@/components/SiteProvider';

interface RecommendationSectionProps {
  recommendations: Recommendation[];
}

const RecommendationSection: React.FC<RecommendationSectionProps> = ({ recommendations }) => {
  const { isTablet } = useSite();

  // Determine the card width based on device type.
  // If isTablet is null, use the default non-tablet width for initial render of skeleton.
  const cardWidth = isTablet ? 'w-40' : 'w-32 sm:w-44';

  // If no recommendations, and device type is known, return null.
  // If no recommendations, but device type is unknown, show skeleton with default width.
  if (!recommendations || recommendations.length === 0) return null;

  return (
    <div className="mt-8">
      <h2 className="text-2xl font-bold mb-4">相关推荐</h2>
      <div className="flex overflow-x-auto space-x-4 pb-4 hide-scrollbar">
        {recommendations.map((rec, index) => (
          <div key={index} className={`flex-none ${cardWidth}`}>
            <VideoCard
              from="recommendation"
              title={rec.title}
              poster={rec.likeposter}
              douban_id={rec.doubanID ? Number(rec.doubanID) : undefined}
              rate={rec.subjectRate}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default RecommendationSection;
