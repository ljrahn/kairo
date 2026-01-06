'use client'

import { useCallback, useMemo } from 'react'
import { format } from 'date-fns'
import { Bar, CartesianGrid, ComposedChart, Line, XAxis, YAxis } from 'recharts'

import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type CustomTooltipProps,
  type ChartConfig,
} from '~/client/ui/chart'
import { cn } from '~/client/lib/utils'
import type {
  IChartConfiguration,
  IChartSeriesInstance,
  IChartView,
} from '~/shared/domain/chart'

const SERIES_COLORS = [
  '#2563eb',
  '#16a34a',
  '#f97316',
  '#ec4899',
  '#0ea5e9',
  '#a855f7',
] as const

function getDefaultSeriesColor(index: number): string {
  return SERIES_COLORS[index % SERIES_COLORS.length] ?? SERIES_COLORS[0]
}

interface IDynamicChartCanvasProps {
  readonly configuration: IChartConfiguration
  readonly chartViews: ReadonlyArray<IChartView>
  readonly className?: string
  readonly containerClassName?: string
}

interface IResolvedSeries {
  readonly series: IChartSeriesInstance
  readonly chartView: IChartView
}

export function DynamicChartCanvas({
  configuration,
  chartViews,
  className,
  containerClassName,
}: IDynamicChartCanvasProps) {
  const resolvedSeries = useMemo<ReadonlyArray<IResolvedSeries>>(
    () =>
      configuration.series
        .filter((series) => series.visible)
        .map((series) => {
          const chartView = chartViews.find(
            (view) => view.id === series.chartViewId,
          )

          if (!chartView) {
            return null
          }

          return { series, chartView }
        })
        .filter((value): value is IResolvedSeries => value !== null),
    [configuration.series, chartViews],
  )

  const chartConfig = useMemo<ChartConfig>(() => {
    const config: ChartConfig = {
      x: { label: configuration.xAxis.label },
    }

    resolvedSeries.forEach(({ series, chartView }, index) => {
      const key = series.id
      const label =
        series.label ||
        chartView.data.metadata.name ||
        series.programIdentifier ||
        key

      const color = series.color ?? getDefaultSeriesColor(index)

      config[key] = {
        label,
        color,
      }
    })

    return config
  }, [configuration.xAxis.label, resolvedSeries])

  const data = useMemo(() => {
    const baseSeries = resolvedSeries[0]

    if (!baseSeries) {
      return [] as Array<Record<string, unknown>>
    }

    const basePoints = baseSeries.chartView.data.chart.points

    return basePoints.map((point, index) => {
      const row: Record<string, unknown> = {
        x: point.x,
      }

      resolvedSeries.forEach(({ series, chartView }) => {
        const seriesPoint = chartView.data.chart.points[index]
        row[series.id] = seriesPoint?.y ?? null
      })

      return row
    })
  }, [resolvedSeries])

  const formatXAxis = useCallback(
    (value: unknown) => {
      if (!(value instanceof Date)) {
        return String(value ?? '')
      }

      const pattern = configuration.xAxis.format ?? 'HH:mm'
      return format(value, pattern)
    },
    [configuration.xAxis.format],
  )

  if (resolvedSeries.length === 0) {
    return (
      <div
        className={cn(
          'flex min-h-[400px] items-center justify-center rounded-lg border-2 border-dashed',
          className,
        )}
      >
        <div className="text-center">
          <svg
            className="mx-auto h-12 w-12 text-muted-foreground/40"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            />
          </svg>
          <p className="mt-3 text-sm font-medium text-muted-foreground">
            No series selected
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Configure series in the panel to visualize data
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className={cn('flex h-full flex-col gap-4', containerClassName)}>
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-base font-semibold leading-tight">
            {configuration.name}
          </h2>
          {configuration.description && (
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              {configuration.description}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[0.7rem] font-medium text-primary">
            {resolvedSeries.length} series
          </span>
        </div>
      </div>

      <div className="flex-1 rounded-lg border bg-card p-4 shadow-sm">
        <ChartContainer
          config={chartConfig}
          className={cn('h-full w-full', className)}
        >
          <ComposedChart data={data}>
            {(configuration.grid.showX || configuration.grid.showY) && (
              <CartesianGrid
                vertical={configuration.grid.showX}
                horizontal={configuration.grid.showY}
                strokeDasharray="3 3"
                className="stroke-muted"
              />
            )}

            <XAxis
              dataKey="x"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              tickFormatter={formatXAxis}
              className="text-xs"
              label={
                configuration.xAxis.label
                  ? {
                      value: configuration.xAxis.label,
                      position: 'insideBottom',
                      offset: -5,
                      style: {
                        fontSize: '0.75rem',
                        fill: 'hsl(var(--muted-foreground))',
                      },
                    }
                  : undefined
              }
            />

            {configuration.yAxes.map((axis) => {
              const hasUnit = axis.unit && axis.unit.trim().length > 0
              const labelValue = hasUnit
                ? `${axis.label ?? ''} (${axis.unit})`.trim()
                : axis.label

              return (
                <YAxis
                  key={axis.id}
                  yAxisId={axis.id}
                  tickLine={false}
                  tickMargin={10}
                  axisLine={false}
                  className="text-xs"
                  orientation={axis.id === 'right' ? 'right' : 'left'}
                  label={
                    labelValue
                      ? {
                          value: labelValue,
                          angle: -90,
                          position:
                            axis.id === 'right' ? 'insideRight' : 'insideLeft',
                          style: {
                            fontSize: '0.75rem',
                            fill: 'hsl(var(--muted-foreground))',
                          },
                        }
                      : undefined
                  }
                  domain={[axis.min ?? 'auto', axis.max ?? 'auto']}
                />
              )
            })}

            {configuration.legend.show && (
              <ChartLegend
                verticalAlign={
                  configuration.legend.position === 'top' ? 'top' : 'bottom'
                }
                content={<ChartLegendContent />}
              />
            )}

            <ChartTooltip
              cursor={{
                stroke: 'hsl(var(--muted-foreground))',
                strokeWidth: 1,
                strokeDasharray: '3 3',
              }}
              content={(props: CustomTooltipProps) => (
                <ChartTooltipContent {...props} hideIndicator hideLabel />
              )}
            />

            {resolvedSeries.map(({ series }) => {
              const dataKey = series.id
              const colorVariable = `var(--color-${dataKey})`

              if (series.type === 'bar') {
                return (
                  <Bar
                    key={dataKey}
                    dataKey={dataKey}
                    yAxisId="left"
                    fill={colorVariable}
                    radius={[4, 4, 0, 0]}
                    {...(series.barGroup ? { stackId: series.barGroup } : {})}
                  />
                )
              }

              return (
                <Line
                  key={dataKey}
                  type="monotone"
                  dataKey={dataKey}
                  stroke={colorVariable}
                  strokeWidth={series.strokeWidth ?? 2.5}
                  dot={false}
                />
              )
            })}
          </ComposedChart>
        </ChartContainer>
      </div>
    </div>
  )
}
