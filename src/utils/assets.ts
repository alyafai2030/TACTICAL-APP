/**
 * Resolves static asset paths cleanly for both local preview and GitHub Pages subpaths
 */
export function getAssetUrl(path: string | null | undefined): string {
  if (!path) return '';

  // Data URLs or external URLs
  if (
    path.startsWith('data:') ||
    path.startsWith('http://') ||
    path.startsWith('https://') ||
    path.startsWith('blob:')
  ) {
    return path;
  }

  // Strip leading slash if present
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  const baseUrl = import.meta.env.BASE_URL || './';
  const prefix = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;

  return `${prefix}${cleanPath}`;
}
