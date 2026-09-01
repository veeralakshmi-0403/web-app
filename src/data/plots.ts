export type Plot = {
  id: string
  number: string
  type: 'HIG' | 'MIG' | 'LIG'
  cost: number
  extent: number
  facing: string
  status: 'Available' | 'Allotted'
  geometryStatus: 'Needs calibration' | 'Calibrated'
  offset: [number, number]
  measurements: { north: string; east: string; south: string; west: string }
  boundaries: { north: string; east: string; south: string; west: string }
  surveyUrl: string
}

export type LayoutAnchor = {
  id: string
  name: string
  latitude: string
  longitude: string
}

export const layoutAnchorNames = [
  'Top-left corner',
  'Top-right corner',
  'Upper-right step',
  'Right-side step',
  'Road junction corner',
  'Central upper-right corner',
  'Central right corner',
  'East boundary corner',
  'Lower-right corner',
  'Bottom-right diagonal corner',
  'Lower interior corner',
  'Lower-left step',
  'Southwest corner',
  'West boundary corner',
  'Upper-left return corner',
] as const

export function createLayoutAnchors(): LayoutAnchor[] {
  return layoutAnchorNames.map((name, index) => ({
    id: `layout-anchor-${String(index + 1).padStart(2, '0')}`,
    name,
    latitude: '',
    longitude: '',
  }))
}

type SourceRecord = Record<string, unknown>

type SourceResponse = { responseObject?: SourceRecord[] }

function numberValue(value: unknown): number {
  const parsed = Number(String(value ?? '').replaceAll(',', '').trim())
  return Number.isFinite(parsed) ? parsed : 0
}

function textValue(value: unknown): string {
  return String(value ?? '').trim()
}

function normalizeRecord(record: SourceRecord, type: Plot['type'], index: number): Plot {
  const status = textValue(record.unitAllottedStatus).toLowerCase() === 'yes' ? 'Allotted' : 'Available'
  return {
    id: `${type.toLowerCase()}-${textValue(record.unitNo).toLowerCase()}-${index}`,
    number: textValue(record.unitNo) || `${type}-${index + 1}`,
    type,
    cost: numberValue(record.unitCost),
    extent: numberValue(record.actualExtent),
    facing: textValue(record.doorFacing) || 'Unspecified',
    status,
    geometryStatus: 'Needs calibration',
    offset: [((index % 20) * 0.00012), (Math.floor(index / 20) * 0.00012) + (type === 'MIG' ? 0.0015 : 0)],
    measurements: { north: textValue(record.northScaling), east: textValue(record.eastScaling), south: textValue(record.southScaling), west: textValue(record.westScaling) },
    boundaries: { north: textValue(record.northBoundary), east: textValue(record.eastBoundry), south: textValue(record.southBoundry), west: textValue(record.westBoundry) },
    surveyUrl: textValue(record.fieldMeasurementBookPath),
  }
}

async function fetchRecords(path: string): Promise<SourceRecord[]> {
  const response = await fetch(path)
  if (!response.ok) throw new Error(`Unable to load ${path}`)
  const data = await response.json() as SourceResponse
  return data.responseObject ?? []
}

export async function loadPlots(): Promise<Plot[]> {
  const [hig, mig, lig] = await Promise.all([fetchRecords('/data/NHIG_Plots.json'), fetchRecords('/data/NMIG_Plots.json'), fetchRecords('/data/NLIG_Plots.json')])
  return [...hig.map((record, index) => normalizeRecord(record, 'HIG', index)), ...mig.map((record, index) => normalizeRecord(record, 'MIG', index)), ...lig.map((record, index) => normalizeRecord(record, 'LIG', index))]
}
