import React from 'react';

interface AdBannerProps {
  userIsPro: boolean;
}

export const AdBanner: React.FC<AdBannerProps> = ({ userIsPro }) => {
  if (userIsPro) {
    return null;
  }

  return (
    <div className="sticky bottom-[60px] w-full bg-zinc-900 p-4 text-center text-sm text-zinc-500 border-t border-zinc-800 z-40">
      Реклама (Ad)
    </div>
  );
};
