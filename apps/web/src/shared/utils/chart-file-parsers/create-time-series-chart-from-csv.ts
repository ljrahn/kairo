import { IChartDetailed } from '~/shared/domain'
import { IChartMetadata } from '~/shared/domain'
import { createTimeSeriesChartFromJson } from './create-time-series-chart-from-json'

export interface IParseTimeSeriesCsvOptions {
  readonly delimiter?: string
  readonly hasHeader?: boolean
}

export function createTimeSeriesChartFromCsv(
  csv: string,
  metadata: IChartMetadata,
  options?: IParseTimeSeriesCsvOptions,
): IChartDetailed {
  const delimiter = options?.delimiter ?? ','
  const hasHeader = options?.hasHeader ?? true

  const lines = csv
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)

  const dataLines = hasHeader ? lines.slice(1) : lines

  const rows: { time: string; value: number }[] = dataLines
    .map((line) => {
      const parts = line.split(delimiter)
      const time = parts[0]
      const valueString = parts[1]

      if (!time || valueString === undefined) {
        return undefined
      }

      const value = Number(valueString)

      if (Number.isNaN(value)) {
        return undefined
      }

      return { time: time.trim(), value }
    })
    .filter((row): row is { time: string; value: number } => row !== undefined)

  return createTimeSeriesChartFromJson(rows, metadata)
}
