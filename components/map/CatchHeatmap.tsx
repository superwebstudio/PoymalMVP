'use client';

import { useEffect, useRef } from 'react';
import type mapboxgl from 'mapbox-gl';
import type { MapCatch } from '@/components/map/hooks/useCatchMarkers';

const SOURCE_ID = 'community-catch-heat';
const LAYER_ID = 'community-catch-heat-layer';

interface CatchHeatmapProps {
  map: React.MutableRefObject<mapboxgl.Map | null>;
  catches: MapCatch[];
  enabled: boolean;
}

export function CatchHeatmap({
  map,
  catches,
  enabled,
}: CatchHeatmapProps): null {
  const readyRef = useRef(false);

  useEffect(() => {
    const mapInstance = map.current;
    if (!mapInstance) return;

    const ensureLayer = () => {
      if (!mapInstance.getSource(SOURCE_ID)) {
        mapInstance.addSource(SOURCE_ID, {
          type: 'geojson',
          data: {
            type: 'FeatureCollection',
            features: [],
          },
        });
      }

      if (!mapInstance.getLayer(LAYER_ID)) {
        mapInstance.addLayer({
          id: LAYER_ID,
          type: 'heatmap',
          source: SOURCE_ID,
          maxzoom: 15,
          paint: {
            'heatmap-weight': 0.8,
            'heatmap-intensity': [
              'interpolate',
              ['linear'],
              ['zoom'],
              0,
              0.4,
              12,
              1.2,
            ],
            'heatmap-color': [
              'interpolate',
              ['linear'],
              ['heatmap-density'],
              0,
              'rgba(0,0,0,0)',
              0.2,
              'rgba(14,165,233,0.35)',
              0.5,
              'rgba(56,189,248,0.65)',
              0.8,
              'rgba(250,204,21,0.8)',
              1,
              'rgba(248,113,113,0.95)',
            ],
            'heatmap-radius': [
              'interpolate',
              ['linear'],
              ['zoom'],
              0,
              8,
              12,
              28,
            ],
            'heatmap-opacity': 0.85,
          },
        });
      }

      readyRef.current = true;
    };

    if (mapInstance.isStyleLoaded()) {
      ensureLayer();
    } else {
      mapInstance.once('load', ensureLayer);
    }

    return () => {
      try {
        if (mapInstance.getLayer(LAYER_ID)) {
          mapInstance.removeLayer(LAYER_ID);
        }
        if (mapInstance.getSource(SOURCE_ID)) {
          mapInstance.removeSource(SOURCE_ID);
        }
      } catch {
        // Map may already be disposed
      }
      readyRef.current = false;
    };
  }, [map]);

  useEffect(() => {
    const mapInstance = map.current;
    if (!mapInstance || !readyRef.current) return;

    const source = mapInstance.getSource(SOURCE_ID) as mapboxgl.GeoJSONSource | undefined;
    if (!source) return;

    if (!enabled) {
      source.setData({ type: 'FeatureCollection', features: [] });
      if (mapInstance.getLayer(LAYER_ID)) {
        mapInstance.setLayoutProperty(LAYER_ID, 'visibility', 'none');
      }
      return;
    }

    if (mapInstance.getLayer(LAYER_ID)) {
      mapInstance.setLayoutProperty(LAYER_ID, 'visibility', 'visible');
    }

    source.setData({
      type: 'FeatureCollection',
      features: catches
        .filter((item) => item.latitude != null && item.longitude != null)
        .map((item) => ({
          type: 'Feature' as const,
          properties: {},
          geometry: {
            type: 'Point' as const,
            coordinates: [item.longitude, item.latitude],
          },
        })),
    });
  }, [catches, enabled, map]);

  return null;
}
