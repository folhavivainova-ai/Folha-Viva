/**
 * Contrato de Provedor de Satélite (Volume 04 - Dados de Satélite)
 * Desacoplamento da busca de cenas Sentinel-2 óptico e Sentinel-1 radar por AOI.
 */

import { GeoPolygon } from '../domain/entities';

export interface SatelliteSceneMetadata {
  id: string;
  provider: 'copernicus' | 'sentinel_hub' | 'planetary_computer';
  mission: 'Sentinel-2A' | 'Sentinel-2B' | 'Sentinel-1A' | 'Sentinel-1B';
  acquiredAt: string;
  cloudCoveragePct: number;
  qualityFlag: 'valid' | 'cloudy' | 'degraded';
}

export interface PlotVegetationMetric {
  metric: 'ndvi' | 'ndre' | 'ndmi' | 'savi';
  mean: number;
  min: number;
  max: number;
  p50: number;
  p90: number;
  confidence: 'high' | 'moderate' | 'low';
  freshnessDate: string;
}

export interface SatelliteQueryOptions {
  aoi: GeoPolygon;
  startDate: string;
  endDate: string;
  maxCloudCoveragePct?: number;
}

export interface ISatelliteProvider {
  searchScenes(options: SatelliteQueryOptions): Promise<SatelliteSceneMetadata[]>;
  getPlotMetrics(plotId: string, sceneId: string): Promise<PlotVegetationMetric[]>;
}

export class MockableSatelliteProvider implements ISatelliteProvider {
  async searchScenes(_options: SatelliteQueryOptions): Promise<SatelliteSceneMetadata[]> {
    // Retorna vazio quando não houver cenas reais ingeridas ainda
    return [];
  }

  async getPlotMetrics(_plotId: string, _sceneId: string): Promise<PlotVegetationMetric[]> {
    return [];
  }
}
