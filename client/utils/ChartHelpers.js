import * as _ from 'lodash'
import * as moment from 'moment'
import { FUEL_TECH } from './FuelTechConfig'

/*** Default amCharts config **/
export function chartConfig(config) {
  const defaultConfig = {
    path: 'dist/amcharts/',
    type: 'stock',
    addClassNames: true,
    mouseWheelZoomEnabled: true,
    mouseWheelScrollEnabled: true,
    export: {
      enabled: false,
      fileName: 'all-regions-generation'
    },
    categoryAxesSettings: {
      minPeriod: '5mm',
      labelOffset: -35,
      axisAlpha: 1,
      tickLength: 35,
      axisHeight: 35,
      axisColor: '#999',
      color: '#000',
      dashLength: 7,
      equalSpacing: true,
      centerLabelOnFullPeriod: false,
      groupToPeriods: ['5mm', '15mm', '30mm', 'hh'],
      dateFormats: [
        {period:'fff',format:'  JJ:NN'},
        {period:'ss',format:'  JJ:NN'},
        {period:'mm',format:'  JJ:NN'},
        {period:'hh',format:'  JJ:NN'},
        {period:'DD',format:'  EEE\n  D MMM'},
        {period:'WW',format:'  EEE\n  D MMM'},
        {period:'MM',format:'  EEE\n  D MMM'},
        {period:'YYYY',format:'  YYYY'}
      ]
    },
    chartCursorSettings: {
      pan: true,
      categoryBalloonColor: '#C74523',
      cursorColor: '#C74523',
      showNextAvailable: true
    },
    panelsSettings: {
      fontFamily: 'Merriweather',
    },
    chartScrollbarSettings: {
      enabled: false
    }
  }

  return _.assign(defaultConfig, config)
}

/*** amCharts Field Mappings **/
export function fieldMappings(keys) {
  const mappings = []

  keys.forEach(ftKey => {
    mappings.push({
      fromField: ftKey,
      toField: ftKey
    })
  })

  return mappings
}

/*** amCharts Stock graphs
    - for 'load' series (i.e. NETINTERCHANGE), hide Fill colour
 **/
export function stockGraphs(keys) {
  const graphs = []

  keys.forEach((ftKey, index) => {
    const colour = FUEL_TECH[ftKey].colour
    const negativeFillAlphas = (ftKey === 'NETINTERCHANGE' || ftKey === 'pumps') ? 0 : 0.8
    const fillAlphas = 0.8

    graphs.push({
      // id: `g${index}`,
      id: ftKey,
      valueField: ftKey,
      type: 'line',
      fillAlphas,
      negativeFillAlphas,
      negativeFillColors: colour,
      lineAlpha: 0,
      lineColor: colour,
      useDataSetColors: false,
    })
  })

  return graphs
}

/*** amCharts Guides
    - shade between 10pm to 7am
 **/
export function guides(start, end) {
  let startDate = moment(start)
  let endDate = moment(end)
  endDate.add(1, 'days')
  const guides = []

  while (moment(startDate).isBefore(endDate)) {
    const dayBefore = startDate.clone()
    dayBefore.subtract(1, 'days')

    guides.push({
      fillColor: '#001f3f',
      fillAlpha: 0.07,
      lineAlpha: 0,
      tickLength: 0,
      date: dayBefore.set({'hour': 22, 'minute': 0, 'second': 0}).toDate(),
      toDate: startDate.set({'hour': 7, 'minute': 0, 'second': 0}).toDate()
    })

    startDate.add(1, 'days')
  }

  return guides
}
