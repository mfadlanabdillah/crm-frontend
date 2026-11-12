import catalogJson from '../../../docs/catalog.json'

export interface CatalogRemote {
  name: string
  path: string
  moduleName: string
  port: number
}

export interface CatalogModule {
  id: string
  remote: string
  basePath: string | null
  path: string
  permission: string | null
  labelKey: string | null
}

export interface CatalogPackage {
  name: string
  path: string
  tests: boolean
  typecheck: boolean
}

export interface Catalog {
  schemaVersion: number
  apps: { name: string; path: string }[]
  remotes: CatalogRemote[]
  modules: CatalogModule[]
  packages: CatalogPackage[]
  owners: string[]
}

export const catalog = catalogJson as Catalog
