import { beforeEach, expect, it, vi } from 'vitest';
import { WeatherService } from './weatherProvider';
const cache = new Map<string,string>();
beforeEach(()=>{cache.clear(); vi.stubGlobal('localStorage',{getItem:(k:string)=>cache.get(k)||null,setItem:(k:string,v:string)=>cache.set(k,v)});});
it('não fabrica números ao receber resposta incompleta',async()=>{
  vi.stubGlobal('fetch',vi.fn().mockResolvedValue({ok:true,json:async()=>({})}));
  await expect(WeatherService.fetchWeather(-15,-56)).rejects.toThrow('indisponível'); expect(cache.size).toBe(0);
});
it('cache de outra localização e cache expirado não substituem clima ausente',async()=>{
  vi.stubGlobal('fetch',vi.fn().mockRejectedValue(new Error('offline')));
  cache.set('folha-weather:1:1',JSON.stringify({updatedAt:new Date().toISOString()}));
  cache.set('folha-weather:2:2',JSON.stringify({updatedAt:'2000-01-01T00:00:00Z'}));
  await expect(WeatherService.fetchWeather(2,2)).rejects.toThrow(); await expect(WeatherService.fetchWeather(3,3)).rejects.toThrow();
});
