import { Matter } from './types';

const map = new Map<string, Matter>();

export async function getMatter(id: string): Promise<Matter | undefined> {
  return map.get(id);
}

export async function setMatter(matter: Matter): Promise<void> {
  map.set(matter.id, { ...matter });
}

export async function updateMatter(
  id: string,
  updates: Partial<Matter>
): Promise<Matter | undefined> {
  const matter = map.get(id);
  if (!matter) return undefined;
  const updated = { ...matter, ...updates };
  map.set(id, updated);
  return updated;
}

export async function getAllMatters(): Promise<Matter[]> {
  return Array.from(map.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}
