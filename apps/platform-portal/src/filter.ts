import type { Catalog } from './catalog'

function matches(query: string, values: (string | number | null)[]) {
  return values.some((value) =>
    String(value ?? '')
      .toLowerCase()
      .includes(query),
  )
}

/** Filter remote, module, dan paket dengan satu kata kunci. Apps dan owner tidak difilter. */
export function filterCatalog(catalog: Catalog, query: string): Catalog {
  const needle = query.trim().toLowerCase()
  if (!needle) return catalog
  return {
    ...catalog,
    remotes: catalog.remotes.filter((remote) =>
      matches(needle, [remote.name, remote.path, remote.moduleName, remote.port]),
    ),
    modules: catalog.modules.filter((mod) =>
      matches(needle, [mod.id, mod.remote, mod.path, mod.permission]),
    ),
    packages: catalog.packages.filter((pkg) => matches(needle, [pkg.name, pkg.path])),
  }
}
