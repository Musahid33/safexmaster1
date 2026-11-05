/** A tenant name is supplied by the future tenant data source, never invented here. */
export function portalName(companyName: string | null | undefined): string {
  const name = companyName?.trim();
  return name ? `${name} - Safety Portal` : 'Safety Portal';
}
