import { describe, expect, it } from 'vitest';
import { breadcrumb, filterNodes, maturity, type Entity } from './model';
const nodes: Entity[] = [{ id: 's', name: 'Estrategia', level: 1, parentId: null }, { id: 'd', name: 'Comercial', level: 2, parentId: 's' }, { id: 'c', name: 'Identidad', level: 4, parentId: 'd', owner: 'Clientes' }];
describe('catalog navigation', () => {
  it('builds contextual paths and filters by ancestor and owner', () => {
    expect(breadcrumb(nodes[2], nodes)).toEqual(['Estrategia', 'Comercial', 'Identidad']);
    expect(filterNodes(nodes, 'Comercial', '4').map(n => n.id)).toEqual(['c']);
    expect(filterNodes(nodes, 'clientes', '4')).toHaveLength(1);
  });
  it('terminates safely on malformed cyclic paths', () => {
    expect(breadcrumb({ id: 'a', name: 'A', parentId: 'a' }, [{ id: 'a', name: 'A', parentId: 'a' }])).toEqual(['A']);
  });
  it('preserves fractional evidence scores', () => { expect(maturity({ id: 'a', people: 2, process: 3, data: 1, technology: 3 })).toBe(2.25); });
});
