import React from 'react';
import { useRouter } from 'next/navigation';
import { MapPin, Info } from 'lucide-react';

interface CatchInfoProps {
    catchData: any;
    dict: any;
    setShowDetailsSheet: (show: boolean) => void;
}

export const CatchInfo: React.FC<CatchInfoProps> = ({ catchData, dict, setShowDetailsSheet }) => {
    const router = useRouter();

    const hasCoordinates =
        catchData.latitude != null &&
        catchData.longitude != null &&
        !Number.isNaN(Number(catchData.latitude)) &&
        !Number.isNaN(Number(catchData.longitude));

    const canOpenLocation = hasCoordinates && !catchData.locationPrivate;

    const handleLocationClick = () => {
        if (!hasCoordinates) return;
        router.push(
            `/map?lat=${catchData.latitude}&lng=${catchData.longitude}&catchId=${catchData.id}`
        );
    };

    return (
        <div className="flex items-center justify-between">
            {canOpenLocation && (
                <button
                    type="button"
                    onClick={handleLocationClick}
                    className="flex items-center gap-2 text-zinc-400 hover:text-zinc-300 transition-colors"
                >
                    <MapPin size={16} className="text-zinc-500" />
                    <span className="text-sm">
                        {catchData.location ||
                            `${Number(catchData.latitude).toFixed(4)}, ${Number(catchData.longitude).toFixed(4)}`}
                    </span>
                </button>
            )}
            {!catchData.isTextOnly && (
                <button
                    onClick={() => setShowDetailsSheet(true)}
                    className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5 text-zinc-300 hover:bg-zinc-800 transition-colors text-sm"
                >
                    <Info size={16} />
                    <span>{dict.catchDetails || 'Catch Details'}</span>
                </button>
            )}
        </div>
    );
};

