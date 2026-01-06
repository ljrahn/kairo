import { IChart, IDomainType } from '@kairo/core'

export interface IChartView<T extends IDomainType = IDomainType> {
  id: string
  data: IChartDetailed<T>
  createdAt: Date
  updatedAt: Date
}

export interface IChartDetailed<T extends IDomainType = IDomainType> {
  readonly chart: IChart<T>
  readonly metadata: IChartMetadata
}

export interface IChartMetadata {
  readonly name?: string
  readonly description?: string
  readonly unit?: string
  readonly source?: IChartSource
  readonly tags?: ReadonlyArray<string>
  readonly domainLabel?: string
}

export type IChartSource = 'sample' | 'user' | 'imported' | 'expression'

export interface IChartProgramBinding {
  readonly programIdentifier: string
  readonly chartId: string
}

export type IChartSeriesType = 'line' | 'bar'

export type IChartAxisId = 'left' | 'right'

export interface IChartSeriesInstance {
  readonly id: string
  readonly chartViewId: string
  readonly programIdentifier?: string
  readonly label?: string
  readonly color?: string
  readonly type: IChartSeriesType
  readonly visible: boolean
  readonly strokeWidth?: number
  readonly lineStyle?: 'solid' | 'dashed'
  readonly barGroup?: string
}

export interface IYAxisConfig {
  readonly id: IChartAxisId
  readonly label?: string
  readonly unit?: string
  readonly min?: number
  readonly max?: number
}

export interface IXAxisConfig {
  readonly label?: string
  readonly unit?: string
  readonly format?: string
}

export interface IChartConfiguration {
  readonly id: string
  readonly name: string
  readonly description?: string
  readonly series: ReadonlyArray<IChartSeriesInstance>
  readonly xAxis: IXAxisConfig
  readonly yAxes: ReadonlyArray<IYAxisConfig>
  readonly legend: {
    readonly show: boolean
    readonly position?: 'top' | 'bottom'
  }
  readonly grid: {
    readonly showX: boolean
    readonly showY: boolean
  }
  readonly createdAt: Date
  readonly updatedAt: Date
}
