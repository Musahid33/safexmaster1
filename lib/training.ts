/** Presentation data supplied by a future, tenant- and site-scoped training service. */
type TrainingMaterialBase = { id: string; title: string; description?: string | null };
export type TrainingMaterial = TrainingMaterialBase & (
  | { type: 'video'; durationMinutes?: number | null }
  | { type: 'module'; format: 'ppt' | 'pdf' | 'image' }
);

/** A null catalog means it is not connected; an empty array means no material was published. */
export type TrainingCatalog = readonly TrainingMaterial[] | null;

/** Only recognized media types are placed in their corresponding sections. */
export function splitTrainingCatalog(catalog: TrainingCatalog) {
  return {
    videos: catalog?.filter((item) => item.type === 'video') ?? [],
    modules: catalog?.filter((item) => item.type === 'module' && ['ppt', 'pdf', 'image'].includes(item.format)) ?? []
  };
}
