/**
 * Provider Climático Desacoplado (Volume 05 - Clima e Evapotranspiração)
 * Utiliza o Open-Meteo como provider aberto sem custos e sem chaves expostas no bundle.
 * Inclui cálculo de ET0 e precipitação acumulada para balanço hídrico.
 */

import { WeatherDataPoint } from '../domain/entities';

export interface WeatherSummary {
  current: WeatherDataPoint;
  forecast: WeatherDataPoint[];
  accumulatedRainLast7DaysMm: number;
  source: string;
  updatedAt: string;
  isCached: boolean;
}

const WEATHER_CACHE_KEY = 'agro_weather_cache';

export class WeatherService {
  /**
   * Busca clima real pelas coordenadas do centroid da propriedade ou talhão.
   */
  static async fetchWeather(lat: number, lng: number): Promise<WeatherSummary> {
    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,precipitation,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,et0_fao_evapotranspiration&timezone=auto&past_days=7`;

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Erro na consulta meteorológica: ${response.status}`);
      }

      const data = await response.json();

      const currentPoint: WeatherDataPoint = {
        timestamp: new Date().toISOString(),
        tempC: Math.round(data.current?.temperature_2m ?? 24),
        precipMm: data.current?.precipitation ?? 0,
        humidityPct: Math.round(data.current?.relative_humidity_2m ?? 65),
        windSpeedKmH: Math.round(data.current?.wind_speed_10m ?? 8),
        et0Mm: data.daily?.et0_fao_evapotranspiration?.[7] ?? 3.5, // dia atual
        conditionText: this.mapWeatherCode(data.current?.weather_code ?? 0),
        isForecast: false,
      };

      // Calcular chuva acumulada dos últimos 7 dias
      const pastRains: number[] = data.daily?.precipitation_sum?.slice(0, 7) || [];
      const rainAccumulated = pastRains.reduce((acc, curr) => acc + (curr || 0), 0);

      // Previsão para os próximos 5 dias
      const forecast: WeatherDataPoint[] = [];
      const dailyDates = data.daily?.time || [];
      const dailyMax = data.daily?.temperature_2m_max || [];
      const dailyPrecip = data.daily?.precipitation_sum || [];
      const dailyET0 = data.daily?.et0_fao_evapotranspiration || [];
      const dailyCodes = data.daily?.weather_code || [];

      // A partir do índice 7 é hoje e próximos dias
      for (let i = 7; i < Math.min(dailyDates.length, 12); i++) {
        forecast.push({
          timestamp: dailyDates[i],
          tempC: Math.round(dailyMax[i] ?? 25),
          precipMm: dailyPrecip[i] ?? 0,
          humidityPct: 60,
          windSpeedKmH: 10,
          et0Mm: dailyET0[i] ?? 3.5,
          conditionText: this.mapWeatherCode(dailyCodes[i] ?? 0),
          isForecast: true,
        });
      }

      const summary: WeatherSummary = {
        current: currentPoint,
        forecast,
        accumulatedRainLast7DaysMm: Math.round(rainAccumulated * 10) / 10,
        source: 'Open-Meteo (FAO-56 Penman-Monteith)',
        updatedAt: new Date().toISOString(),
        isCached: false,
      };

      // Salva no cache local para resiliência offline (V05-E04)
      localStorage.setItem(WEATHER_CACHE_KEY, JSON.stringify(summary));
      return summary;
    } catch (err) {
      // Degradação graciosa offline
      const cached = localStorage.getItem(WEATHER_CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached) as WeatherSummary;
        parsed.isCached = true;
        return parsed;
      }

      // Se nunca sincronizou e não tem internet
      return {
        current: {
          timestamp: new Date().toISOString(),
          tempC: 0,
          precipMm: 0,
          humidityPct: 0,
          windSpeedKmH: 0,
          et0Mm: 0,
          conditionText: 'Sem conexão de clima',
          isForecast: false,
        },
        forecast: [],
        accumulatedRainLast7DaysMm: 0,
        source: 'Aguardando sincronização de rede',
        updatedAt: new Date().toISOString(),
        isCached: true,
      };
    }
  }

  private static mapWeatherCode(code: number): string {
    if (code === 0) return 'Céu limpo';
    if (code === 1 || code === 2) return 'Parcialmente nublado';
    if (code === 3) return 'Nublado';
    if (code >= 45 && code <= 48) return 'Nevoeiro';
    if (code >= 51 && code <= 55) return 'Garoa';
    if (code >= 61 && code <= 65) return 'Chuva';
    if (code >= 80 && code <= 82) return 'Pancadas de chuva';
    if (code >= 95) return 'Trovoada';
    return 'Tempo estável';
  }
}
