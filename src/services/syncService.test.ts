import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Mutation } from '../domain/sync';
const mocks = vi.hoisted(()=>({ snapshot:vi.fn(),ack:vi.fn(),fail:vi.fn(),identity:vi.fn(),send:vi.fn() }));
vi.mock('../offline/store',()=>({OfflineStore:{snapshot:mocks.snapshot,acknowledge:mocks.ack,fail:mocks.fail}}));
vi.mock('./identity',()=>({ensureIdentity:mocks.identity}));
vi.mock('./dataRepository',()=>({sendMutation:mocks.send}));
vi.mock('./supabase',()=>({supabase:{}}));
import { synchronize, getSyncStatus } from './syncService';
const m: Mutation = {id:'m',entity:'producer_profile',action:'insert',payload:{id:'p'},timestamp:'t',status:'pending',retryCount:0};
beforeEach(()=>{vi.clearAllMocks();vi.stubGlobal('navigator',{onLine:true});mocks.snapshot.mockResolvedValue({queue:[m],lastSync:'t'});mocks.identity.mockResolvedValue('u');});
describe('consumidor da fila',()=>{
  it('não confirma nem envia filhos após erro no pai',async()=>{
    mocks.snapshot.mockResolvedValue({queue:[m,{...m,id:'child',entity:'property'}]});mocks.send.mockRejectedValue(new Error('Sem confirmação'));
    await synchronize();expect(mocks.ack).not.toHaveBeenCalled();expect(mocks.send).toHaveBeenCalledTimes(1);expect(mocks.fail).toHaveBeenCalled();expect(getSyncStatus().phase).toBe('error');
  });
  it('um envio concorrente e recibo confirmado',async()=>{
    mocks.send.mockResolvedValue({mutation_id:'m',entity_id:'p',committed_at:'t'});
    await Promise.all([synchronize(),synchronize()]);expect(mocks.send).toHaveBeenCalledTimes(1);expect(mocks.ack).toHaveBeenCalledWith('m','t');expect(getSyncStatus().phase).toBe('synced');
  });
  it('offline não tenta autenticar nem enviar',async()=>{vi.stubGlobal('navigator',{onLine:false});await synchronize();expect(mocks.identity).not.toHaveBeenCalled();expect(getSyncStatus().phase).toBe('offline');});
});
