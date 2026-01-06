import { createChart, createTimeDomain } from '@kairo/core'
import { IChartDetailed, IChartMetadata } from '~/shared/domain'

export function createTimeSeriesChartFromJson(
  rows: ReadonlyArray<{ time: string | number | Date; value: number }>,
  metadata: IChartMetadata,
): IChartDetailed {
  const domain = createTimeDomain()

  const points = rows
    .map((row) => ({ x: new Date(row.time), y: row.value }))
    .filter(
      (point) => !Number.isNaN(point.y) && !Number.isNaN(point.x.getTime()),
    )
    .sort((a, b) => a.x.getTime() - b.x.getTime())

  const chart = createChart(domain, points)

  return { metadata, chart }
}
