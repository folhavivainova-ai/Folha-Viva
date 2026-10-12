import type { WeatherDataPoint } from '../domain/entities';
import { clientConfig } from '../config/client';
export interface WeatherSummary {
  current: WeatherDataPoint; forecast: WeatherDataPoint[];
  accumulatedRainLast7DaysMm: number; source: string; updatedAt: string; isCached: boolean;
}
export interface WeatherProvider { fetchWeather(lat: number, lng: number): Promise<WeatherSummary> }
function number(value: unknown): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) throw new Error('Dado de clima indisponível.');
  return value;
}
export class WeatherService {
  static async fetchWeather(lat: number, lng: number): Promise<WeatherSummary> {
    if (clientConfig.weather === 'disabled') throw new Error('Clima indisponível.');
    const key = `folha-weather:${lat}:${lng}`;
    try {
      const response = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,precipitation,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,et0_fao_evapotranspiration&timezone=auto&past_days=7`);
      if (!response.ok) throw new Error('Clima indisponível.');
      const data = await response.json();
      const daily = data.daily;
      if (!data.current?.time || !daily?.time || daily.precipitation_sum?.length < 7) throw new Error('Clima incompleto.');
      const current: WeatherDataPoint = {
        timestamp: data.current.time, tempC: number(data.current.temperature_2m), precipMm: number(data.current.precipitation), humidityPct: number(data.current.relative_humidity_2m), windSpeedKmH: number(data.current.wind_speed_10m), et0Mm: number(daily.et0_fao_evapotranspiration?.[7]), conditionText: this.mapWeatherCode(number(data.current.weather_code)), isForecast: true,
      };
      const forecast: WeatherDataPoint[] = daily.time.slice(7, 12).map((date: string, index: number) => {
        const i = index + 7;
        return { timestamp: date, tempC: number(daily.temperature_2m_max[i]), precipMm: number(daily.precipitation_sum[i]), humidityPct: null, windSpeedKmH: null, et0Mm: number(daily.et0_fao_evapotranspiration[i]), conditionText: this.mapWeatherCode(number(daily.weather_code[i])), isForecast: true };
      });
      const summary: WeatherSummary = { current, forecast, accumulatedRainLast7DaysMm: daily.precipitation_sum.slice(0,7).map(number).reduce((a: number,b: number) => a+b,0), source: 'Open-Meteo — dados modelados; ET0 FAO-56', updatedAt: new Date().toISOString(), isCached: false };
      try { localStorage.setItem(key, JSON.stringify(summary)); } catch { /* Falha de cache não invalida resposta real. */ }
      return summary;
    } catch {
      const cached = localStorage.getItem(key);
      if (cached) {
        try { const summary = JSON.parse(cached) as WeatherSummary; if (Date.now() - Date.parse(summary.updatedAt) <= 86400000) return { ...summary, isCached: true }; } catch { /* cache inválido */ }
      }
      throw new Error('Clima indisponível para este local.');
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
    return 'Condição não classificada';
  }
}
export const weatherProvider: WeatherProvider = { fetchWeather: WeatherService.fetchWeather.bind(WeatherService) };
