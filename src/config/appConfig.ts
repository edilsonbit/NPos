type DataSourceMode = 'mock' | 'firebase'

const dataSourceValue = import.meta.env.VITE_DATA_SOURCE ?? 'mock'

export const appConfig: { dataSource: DataSourceMode } = {
  dataSource: dataSourceValue === 'firebase' ? 'firebase' : 'mock',
}
