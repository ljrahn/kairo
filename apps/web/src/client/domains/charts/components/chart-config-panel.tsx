'use client'

import * as React from 'react'

import { Input } from '~/client/ui/input'
import { Label } from '~/client/ui/label'
import { Switch } from '~/client/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/client/ui/select'
import { Button } from '~/client/ui/button'
import { cn } from '~/client/lib/utils'
import type {
  IYAxisConfig,
  IChartAxisId,
  IChartConfiguration,
  IChartSeriesInstance,
  IChartSeriesType,
  IChartView,
} from '~/shared/domain/chart'

interface IChartConfigPanelProps {
  readonly configuration: IChartConfiguration
  readonly chartViews: ReadonlyArray<IChartView>
  readonly onChange: (configuration: IChartConfiguration) => void
  readonly className?: string
}

export function ChartConfigPanel({
  configuration,
  chartViews,
  onChange,
  className,
}: IChartConfigPanelProps) {
  const handleRootChange = React.useCallback(
    (partial: Partial<IChartConfiguration>) => {
      onChange({ ...configuration, ...partial })
    },
    [configuration, onChange],
  )

  const handleXAxisChange = React.useCallback(
    (partial: Partial<IChartConfiguration['xAxis']>) => {
      handleRootChange({ xAxis: { ...configuration.xAxis, ...partial } })
    },
    [configuration.xAxis, handleRootChange],
  )

  const handleYAxisChange = React.useCallback(
    (axisId: IChartAxisId, partial: Partial<IYAxisConfig>) => {
      const updated = configuration.yAxes.map((axis) =>
        axis.id === axisId ? { ...axis, ...partial } : axis,
      )

      handleRootChange({ yAxes: updated })
    },
    [configuration.yAxes, handleRootChange],
  )

  const handleSeriesChange = React.useCallback(
    (seriesId: string, partial: Partial<IChartSeriesInstance>) => {
      const updated = configuration.series.map((series) =>
        series.id === seriesId ? { ...series, ...partial } : series,
      )

      handleRootChange({ series: updated })
    },
    [configuration.series, handleRootChange],
  )

  const handleLegendShowChange = React.useCallback(
    (show: boolean) => {
      handleRootChange({ legend: { ...configuration.legend, show } })
    },
    [configuration.legend, handleRootChange],
  )

  const handleLegendPositionChange = React.useCallback(
    (position: IChartConfiguration['legend']['position']) => {
      handleRootChange({ legend: { ...configuration.legend, position } })
    },
    [configuration.legend, handleRootChange],
  )

  const handleGridChange = React.useCallback(
    (partial: Partial<IChartConfiguration['grid']>) => {
      handleRootChange({ grid: { ...configuration.grid, ...partial } })
    },
    [configuration.grid, handleRootChange],
  )

  const getSeriesName = React.useCallback(
    (series: IChartSeriesInstance) => {
      const view = chartViews.find((v) => v.id === series.chartViewId)

      return (
        series.label ||
        view?.data.metadata.name ||
        series.programIdentifier ||
        series.id
      )
    },
    [chartViews],
  )

  return (
    <div className={cn('space-y-4 text-xs', className)}>
      {/* Chart meta */}
      <section className="space-y-2">
        <div className="space-y-1.5">
          <Label htmlFor="chart-name">Chart title</Label>
          <Input
            id="chart-name"
            value={configuration.name}
            onChange={(event) => handleRootChange({ name: event.target.value })}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="chart-description">Description</Label>
          <Input
            id="chart-description"
            value={configuration.description ?? ''}
            onChange={(event) =>
              handleRootChange({ description: event.target.value || undefined })
            }
          />
        </div>
      </section>

      {/* Axes */}
      <section className="space-y-3">
        <div className="font-medium text-[0.7rem] uppercase tracking-wide text-muted-foreground">
          Axes
        </div>

        {/* X axis */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            <Label htmlFor="x-axis-label">X axis label</Label>
          </div>
          <Input
            id="x-axis-label"
            value={configuration.xAxis.label ?? ''}
            onChange={(event) =>
              handleXAxisChange({
                label: event.target.value || undefined,
              })
            }
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="x-axis-format">X axis format</Label>
          <Input
            id="x-axis-format"
            placeholder="e.g. HH:mm, MMM d"
            value={configuration.xAxis.format ?? ''}
            onChange={(event) =>
              handleXAxisChange({
                format: event.target.value || undefined,
              })
            }
          />
        </div>

        {/* Y axes */}
        <div className="space-y-2">
          {configuration.yAxes.map((axis) => (
            <div key={axis.id} className="space-y-1.5 rounded-md border p-2">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-medium uppercase tracking-wide text-[0.65rem] text-muted-foreground">
                    {axis.id === 'left' ? 'Left Y axis' : 'Right Y axis'}
                  </span>
                </div>
              </div>

              <div className="mt-1 grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label htmlFor={`y-${axis.id}-label`}>Label</Label>
                  <Input
                    id={`y-${axis.id}-label`}
                    value={axis.label ?? ''}
                    onChange={(event) =>
                      handleYAxisChange(axis.id, {
                        label: event.target.value || undefined,
                      })
                    }
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor={`y-${axis.id}-unit`}>Unit</Label>
                  <Input
                    id={`y-${axis.id}-unit`}
                    value={axis.unit ?? ''}
                    onChange={(event) =>
                      handleYAxisChange(axis.id, {
                        unit: event.target.value || undefined,
                      })
                    }
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor={`y-${axis.id}-min`}>Min</Label>
                  <Input
                    id={`y-${axis.id}-min`}
                    type="number"
                    value={axis.min ?? ''}
                    onChange={(event) => {
                      const value = event.target.value
                      handleYAxisChange(axis.id, {
                        min: value === '' ? undefined : Number(value),
                      })
                    }}
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor={`y-${axis.id}-max`}>Max</Label>
                  <Input
                    id={`y-${axis.id}-max`}
                    type="number"
                    value={axis.max ?? ''}
                    onChange={(event) => {
                      const value = event.target.value
                      handleYAxisChange(axis.id, {
                        max: value === '' ? undefined : Number(value),
                      })
                    }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Legend & grid */}
      <section className="space-y-3">
        <div className="font-medium text-[0.7rem] uppercase tracking-wide text-muted-foreground">
          Legend & grid
        </div>

        <div className="flex items-center justify-between gap-2">
          <Label>Show legend</Label>
          <Switch
            size="sm"
            checked={configuration.legend.show}
            onCheckedChange={handleLegendShowChange}
          />
        </div>

        <div className="space-y-1.5">
          <Label>Legend position</Label>
          <Select
            value={configuration.legend.position ?? 'bottom'}
            onValueChange={(value) =>
              handleLegendPositionChange(
                value as IChartConfiguration['legend']['position'],
              )
            }
          >
            <SelectTrigger size="sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="top">Top</SelectItem>
              <SelectItem value="bottom">Bottom</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center justify-between gap-2">
          <Label>Show vertical grid</Label>
          <Switch
            size="sm"
            checked={configuration.grid.showX}
            onCheckedChange={(checked) => handleGridChange({ showX: checked })}
          />
        </div>

        <div className="flex items-center justify-between gap-2">
          <Label>Show horizontal grid</Label>
          <Switch
            size="sm"
            checked={configuration.grid.showY}
            onCheckedChange={(checked) => handleGridChange({ showY: checked })}
          />
        </div>
      </section>

      {/* Series list */}
      <section className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="font-medium text-[0.7rem] uppercase tracking-wide text-muted-foreground">
            Series
          </div>
          <Button size="xs" variant="outline" type="button" disabled>
            Add series
          </Button>
        </div>

        <div className="space-y-2">
          {configuration.series.length === 0 && (
            <div className="text-xs text-muted-foreground">
              No series configured for this chart.
            </div>
          )}

          {configuration.series.map((series) => (
            <div key={series.id} className="space-y-2 rounded-md border p-2">
              <div className="flex items-center justify-between gap-2">
                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <div className="truncate text-xs font-medium">
                    {getSeriesName(series)}
                  </div>
                  {series.programIdentifier && (
                    <div className="text-[0.65rem] text-muted-foreground">
                      DSL identifier: <code>{series.programIdentifier}</code>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <Label className="text-[0.65rem]">Visible</Label>
                  <Switch
                    size="sm"
                    checked={series.visible}
                    onCheckedChange={(checked) =>
                      handleSeriesChange(series.id, { visible: checked })
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label htmlFor={`series-${series.id}-label`}>Label</Label>
                  <Input
                    id={`series-${series.id}-label`}
                    value={series.label ?? ''}
                    onChange={(event) =>
                      handleSeriesChange(series.id, {
                        label: event.target.value || undefined,
                      })
                    }
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor={`series-${series.id}-color`}>Color</Label>
                  <Input
                    id={`series-${series.id}-color`}
                    value={series.color ?? ''}
                    onChange={(event) =>
                      handleSeriesChange(series.id, {
                        color: event.target.value || undefined,
                      })
                    }
                    placeholder="#2563eb"
                  />
                </div>

                <div className="space-y-1">
                  <Label>Type</Label>
                  <Select
                    value={series.type}
                    onValueChange={(value) =>
                      handleSeriesChange(series.id, {
                        type: value as IChartSeriesType,
                      })
                    }
                  >
                    <SelectTrigger size="sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="line">Line</SelectItem>
                      <SelectItem value="bar">Bar</SelectItem>
                      <SelectItem value="area">Area</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {series.type !== 'bar' && (
                  <div className="space-y-1">
                    <Label htmlFor={`series-${series.id}-width`}>
                      Line width
                    </Label>
                    <Input
                      id={`series-${series.id}-width`}
                      type="number"
                      value={series.strokeWidth ?? ''}
                      onChange={(event) => {
                        const value = event.target.value
                        handleSeriesChange(series.id, {
                          strokeWidth: value === '' ? undefined : Number(value),
                        })
                      }}
                    />
                  </div>
                )}

                {series.type === 'bar' && (
                  <div className="space-y-1">
                    <Label htmlFor={`series-${series.id}-group`}>
                      Stack group
                    </Label>
                    <Input
                      id={`series-${series.id}-group`}
                      value={series.barGroup ?? ''}
                      onChange={(event) =>
                        handleSeriesChange(series.id, {
                          barGroup: event.target.value || undefined,
                        })
                      }
                      placeholder="group-1"
                    />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
