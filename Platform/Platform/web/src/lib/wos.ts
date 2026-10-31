/** عميل /api/wos — مساحاتي والخدمات المشتركة (سجل، سلة، روابط، وارد، جدول أعمال). */
import { req, type Deleted } from './api.js';
import type { Automation, HistoryEntry, InboxEntry, LinkView, RefInfo, RelationKind, TrashEntry, ViewConfig, ViewKind, WosItem, WosSpace, WosType, WosView } from '../../../shared/wos.js';
import type { TemplateInfo } from '../../../shared/templates.js';

export type Space = WosSpace & { type: WosType };
export interface SpaceFull { space: Space; items: WosItem[]; views: WosView[]; automations: Automation[] }
export interface ItemFull { item: WosItem; space: Space; children: WosItem[]; links: LinkView[]; history: HistoryEntry[] }
export interface AgendaEntry { ref: string; kind: 'assessment' | 'item' | 'workout'; title: string; subtitle: string; date: string | null; approx: boolean; color: string; to: string; done: boolean; status: string | null; status_label: string | null; category: 'todo' | 'active' | 'done' | 'blocked'; space_id?: string; weight?: number }
export interface Agenda { today: string; from: string; to: string; overdue: AgendaEntry[]; range: AgendaEntry[]; undated: number }
export type ItemBody = Partial<Pick<WosItem, 'title' | 'status' | 'parent_id' | 'start' | 'due' | 'sort' | 'archived' | 'space_id'>> & { data?: Record<string, unknown> };

const e = encodeURIComponent;
export const wos = {
  profile: () => req<{ name: string | null }>('GET', '/api/wos/profile'),
  setProfile: (name: string) => req<{ name: string | null }>('PUT', '/api/wos/profile', { name }),
  spaces: (archived = false) => req<Space[]>('GET', `/api/wos/spaces${archived ? '?archived=1' : ''}`),
  createSpace: (b: { template_id?: string; name?: string; icon?: string; color?: string; description?: string | null }) => req<Space>('POST', '/api/wos/spaces', b),
  space: (id: string, archived = false) => req<SpaceFull>('GET', `/api/wos/spaces/${e(id)}${archived ? '?archived=1' : ''}`),
  editSpace: (id: string, b: Partial<Pick<WosSpace, 'name' | 'icon' | 'color' | 'description' | 'archived'>>) => req<Space>('PATCH', `/api/wos/spaces/${e(id)}`, b),
  setType: (id: string, t: Pick<WosType, 'name' | 'icon' | 'color' | 'fields' | 'statuses'>) => req<Space>('PUT', `/api/wos/spaces/${e(id)}/type`, t),
  delSpace: (id: string) => req<Deleted>('DELETE', `/api/wos/spaces/${e(id)}`),
  dupSpace: (id: string, with_items = true) => req<Space>('POST', `/api/wos/spaces/${e(id)}/duplicate`, { with_items }),
  orderSpaces: (ids: string[]) => req<Space[]>('PUT', '/api/wos/spaces/order', { ids }),
  saveTemplate: (id: string, b: { name: string; description?: string; with_items?: boolean }) => req<{ id: string; name: string }>('POST', `/api/wos/spaces/${e(id)}/save-template`, b),
  exportUrl: (id: string, format: 'json' | 'csv') => `/api/wos/spaces/${e(id)}/export${format === 'csv' ? '?format=csv' : ''}`,
  addItem: (spaceId: string, b: ItemBody & { title: string }) => req<WosItem>('POST', `/api/wos/spaces/${e(spaceId)}/items`, b),
  item: (id: string) => req<ItemFull>('GET', `/api/wos/items/${e(id)}`),
  editItem: (id: string, b: ItemBody) => req<WosItem>('PATCH', `/api/wos/items/${e(id)}`, b),
  delItem: (id: string) => req<Deleted>('DELETE', `/api/wos/items/${e(id)}`),
  dupItem: (id: string) => req<WosItem>('POST', `/api/wos/items/${e(id)}/duplicate`),
  bulk: (ids: string[], op: 'update' | 'delete' | 'archive' | 'unarchive' | 'move', extra: { patch?: ItemBody; space_id?: string } = {}) => req<{ ok: boolean; count: number; undo?: string; errors?: { id: string; error: string }[] }>('POST', '/api/wos/items/bulk', { ids, op, ...extra }),
  addView: (b: { scope: string; name: string; kind: ViewKind; config?: ViewConfig }) => req<WosView>('POST', '/api/wos/views', b),
  editView: (id: string, b: Partial<Pick<WosView, 'name' | 'kind' | 'config' | 'sort'>>) => req<WosView>('PATCH', `/api/wos/views/${e(id)}`, b),
  delView: (id: string) => req<Deleted>('DELETE', `/api/wos/views/${e(id)}`),
  automations: () => req<Automation[]>('GET', '/api/wos/automations'),
  addAutomation: (spaceId: string, b: Pick<Automation, 'name' | 'enabled' | 'trigger' | 'action'>) => req<Automation>('POST', `/api/wos/spaces/${e(spaceId)}/automations`, b),
  editAutomation: (id: string, b: Partial<Pick<Automation, 'name' | 'enabled' | 'trigger' | 'action'>>) => req<Automation>('PATCH', `/api/wos/automations/${e(id)}`, b),
  delAutomation: (id: string) => req<Deleted>('DELETE', `/api/wos/automations/${e(id)}`),
  templates: () => req<TemplateInfo[]>('GET', '/api/wos/templates'),
  delTemplate: (id: string) => req<{ ok: boolean }>('DELETE', `/api/wos/templates/${e(id)}`),
  resolve: (ref: string) => req<RefInfo>('GET', `/api/wos/refs/resolve?ref=${e(ref)}`),
  refs: (q: string) => req<RefInfo[]>('GET', `/api/wos/refs?q=${e(q)}`),
  links: (ref: string) => req<LinkView[]>('GET', `/api/wos/links?ref=${e(ref)}`),
  link: (src: string, dst: string, kind: RelationKind = 'relates') => req<{ id: string; links: LinkView[] }>('POST', '/api/wos/relations', { src, dst, kind }),
  unlink: (id: string) => req<Deleted>('DELETE', `/api/wos/relations/${e(id)}`),
  history: (o: { ref?: string; limit?: number; before?: string } = {}) => req<HistoryEntry[]>('GET', `/api/wos/history?${new URLSearchParams(Object.entries(o).filter(([, v]) => v !== undefined).map(([k, v]) => [k, String(v)])).toString()}`),
  revert: (id: string) => req<{ ok: boolean }>('POST', `/api/wos/history/${e(id)}/revert`),
  trash: () => req<(TrashEntry & { count: number })[]>('GET', '/api/wos/trash'),
  restore: (token: string) => req<{ ok: boolean; label: string }>('POST', `/api/wos/trash/${e(token)}/restore`),
  purge: (token?: string) => req<{ ok: boolean; removed: number }>('DELETE', token ? `/api/wos/trash/${e(token)}` : '/api/wos/trash'),
  inbox: () => req<InboxEntry[]>('GET', '/api/wos/inbox'),
  readInbox: (ids?: string[]) => req<{ ok: boolean }>('POST', '/api/wos/inbox/read', ids ? { ids } : {}),
  agenda: (from?: string, to?: string) => req<Agenda>('GET', `/api/wos/agenda${from ? `?from=${from}${to ? `&to=${to}` : ''}` : ''}`),
  everything: () => req<{ spaces: Space[]; entries: AgendaEntry[] }>('GET', '/api/wos/everything'),
  shares: (scope: string) => req<{ token: string; scope: string; created_at: string }[]>('GET', `/api/wos/shares?scope=${e(scope)}`),
  share: (scope: string, view_id?: string) => req<{ token: string; url: string }>('POST', '/api/wos/shares', { scope, view_id }),
  unshare: (token: string) => req<{ ok: boolean }>('DELETE', `/api/wos/shares/${e(token)}`),
  publicView: (token: string) => req<{ space: Pick<WosSpace, 'name' | 'icon' | 'color' | 'description'>; type: WosType; items: WosItem[]; view: WosView | null }>('GET', `/api/public/${e(token)}`),
};
