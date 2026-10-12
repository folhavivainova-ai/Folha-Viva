import { describe, expect, it } from 'vitest';
import { point, polygon, mapMutation } from './dataRepository';
describe('contratos geoespaciais', () => {
  it('troca eixos e fecha o anel sem duplicar o fechamento', () => {
    const geometry = polygon({ type:'Polygon', coordinates:[[-15,-56],[-15,-56.1],[-15.1,-56.1]] });
    expect(geometry.coordinates[0]).toEqual([[-56,-15],[-56.1,-15],[-56.1,-15.1],[-56,-15]]);
    expect(point({lat:0,lng:0})?.coordinates).toEqual([0,0]);
  });
  it('recusa coordenadas impossíveis e contorno insuficiente', () => {
    expect(()=>point({lat:100,lng:0})).toThrow(); expect(()=>polygon({type:'Polygon',coordinates:[]})).toThrow();
  });
  it('perfil não vira propriedade', () => {
    const p = mapMutation({id:'m',entity:'producer_profile',action:'insert',timestamp:'t',status:'pending',retryCount:0,payload:{id:'p',deviceSessionId:'d',displayName:'Nome',createdAt:'t'}});
    expect(p.display_name).toBe('Nome'); expect(p).not.toHaveProperty('producer_id');
  });
});
