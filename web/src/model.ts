export type Entity = { id: string; [key: string]: string | number | null };
export type Collection =
  | "goals"
  | "nodes"
  | "alignments"
  | "assessments"
  | "assets"
  | "traces"
  | "initiatives"
  | "decisions";
export type Workspace = Record<Collection, Entity[]> & { audit: Entity[] };
export type Priority = {
  id: string;
  name: string;
  maturity: number;
  gap: number;
  impact: number;
  opportunity: number;
  score: number;
  quadrant: string;
  investment: number;
  teamType: string;
  funded: boolean;
  reason: string;
};
export type Portfolio = {
  priorities: Priority[];
  budget: number | null;
  allocated: number;
  remaining: number | null;
  strategicBets: number;
};
export type Issue = {
  entityId: string;
  severity: string;
  rule: string;
  message: string;
};
export const levels = [
  "Estrategia",
  "Dominio",
  "Subdominio",
  "Capacidad",
  "Subcapacidad",
];
export const money = (n: number) =>
  new Intl.NumberFormat("es-EC", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
export function breadcrumb(node: Entity, nodes: Entity[]): string[] {
  const result: string[] = [];
  const seen = new Set<string>();
  let current: Entity | undefined = node;
  while (current && !seen.has(current.id)) {
    seen.add(current.id);
    result.unshift(String(current.name));
    current = nodes.find((n) => n.id === current?.parentId);
  }
  return result;
}
export const maturity = (a: Entity) =>
  (Number(a.people) +
    Number(a.process) +
    Number(a.data) +
    Number(a.technology)) /
  4;
export function filterNodes(
  nodes: Entity[],
  search: string,
  level: string,
): Entity[] {
  return nodes.filter(
    (n) =>
      (!level || String(n.level) === level) &&
      `${n.name} ${n.owner} ${breadcrumb(n, nodes).join(" ")}`
        .toLocaleLowerCase()
        .includes(search.toLocaleLowerCase()),
  );
}
