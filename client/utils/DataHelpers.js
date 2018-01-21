import * as moment from 'moment'
import { FUEL_TECH } from './FuelTechConfig'

export function generateChartData2 (data) {
  const container = new Object()

  const keys = []
  Object.keys(FUEL_TECH).forEach(ftKey => {
    const find = data.find(ft => ft.fuel_tech === ftKey)
    const hasPrice = data.find(ft => ft.type === ftKey)
    if (find || hasPrice) {
      keys.push(ftKey)
    }
  })

  // const ft = data[0]
  // const history = ft['history']
  // const startDate = history.start
  // const seriesData = history.data
  // let duration

  // try {
  //   duration = parseInterval(history.interval)
  // } catch (e) {
  //   console.error(e)
  // }

  // const start = moment(startDate, moment.ISO_8601)

  // for (let i=0; i<seriesData.length; i++) {
  //   const now = moment(start).add(duration.value * i, duration.key)
  //   const nowISO = moment(now).toISOString()
  //   if (!container[nowISO]) {
  //     container[nowISO] = {}
  //   }

  //   Object.keys(FUEL_TECH).forEach(ftKey => {
  //     const find = data.find(ft => ft.fuel_tech === ftKey)
  //     if (find) {
  //       container[nowISO][ftKey] = 0
  //     }
  //   })
  // }

  function createContainerObj (history, ftKey) {
    const startDate = history.start
    const seriesData = history.data

    let duration

    try {
      duration = parseInterval(history.interval)
    } catch (e) {
      console.error(e)
    }

    const start = moment(startDate, moment.ISO_8601)

    for (let i=0; i<seriesData.length; i++) {
      const now = moment(start).add(duration.value * i, duration.key)
      const d = (ftKey === 'exports' || ftKey === 'imports' || ftKey === 'pumps') ? -seriesData[i] : seriesData[i]

      const nowISO = moment(now).toISOString()

      if (!container[nowISO]) {
        container[nowISO] = {}
        keys.forEach(key => {
          container[nowISO][key] = null
        })
      }
      container[nowISO][ftKey] = d
    }
  }

  Object.keys(FUEL_TECH).forEach(ftKey => {
    const ft = data.find(ft => {
      return ft.fuel_tech === ftKey
    })

    const price = data.find(ft => ft.type === ftKey)
    const history = ft ? ft['history'] : (price ? price['history'] : null)

    if (ft || price) {
      createContainerObj(history, ftKey)

      // TODO: also check for forecast data
      // if (ft && ft.forecast) {
      //   createContainerObj(ft.forecast, ftKey)
      // }
    }
  })

  const newChartData = []
  let current = null
  Object.keys(container).forEach(dateKey => {
    const obj = Object.assign({}, container[dateKey])
    obj.date = moment(dateKey).toDate()

    if (obj['rooftop_solar'] !== null) {
      current = obj['rooftop_solar']
    } else if (obj['rooftop_solar'] === null) {
      obj['rooftop_solar'] = current
    }

    newChartData.push(obj)
  })
  newChartData.sort((a, b) => {
    return moment(a.date).valueOf() - moment(b.date).valueOf()
  })

  return newChartData.slice()
}

export function generatePriceData2 (chartSeries, payload) {
  const priceData = [].concat(chartSeries)
  const rrp = payload['RRP']
  const rrpKey = 'RRP'
  const startDate = rrp.start
  const rrpData = rrp.data
  const start = moment(startDate, moment.ISO_8601)
  let duration
  try {
    duration = parseInterval(rrp.interval)
  } catch (e) {
    console.error(e)
  }

  let rrpIndex = 0
  priceData.forEach(item => {
    const now = moment(start).add(duration.value * rrpIndex, duration.key)
    if (item.date.toString() === now.toDate().toString()) {
      item[rrpKey] = rrpData[rrpIndex]
      rrpIndex++
    } else {
      item[rrpKey] = rrpData[rrpIndex - 1]
    }
  })

  /** negative price cannot be logathrmic **/
  // findDate[ftKey] = ftData[x] < 0 ? -ftData[x] : ftData[x]

  return priceData
}

export function generateChartData (data) {
  const chartData = []

  Object.keys(FUEL_TECH).forEach(ftKey => {
    if (data[ftKey]) {
      const ft = data[ftKey]
      const startDate = ft.start
      const ftData = ft.data
      const hasChartData = chartData.length ? true : false
      let duration

      try {
        duration = parseInterval(ft.interval)
      } catch (e) {
        console.error(e)
      }

      const start = moment(startDate, moment.ISO_8601)

      for (let i=0; i<ftData.length; i++) {
        const now = moment(start).add(duration.value * i, duration.key)
        const d = (ftKey === 'NETINTERCHANGE' || ftKey === 'pumps') ? -ftData[i] : ftData[i]

        if (!hasChartData) {
          chartData[i] = {
            date: now.toDate()
          }
        }
        chartData[i][ftKey] = d
      }
    }
  })

  return chartData
}

/**
 * @param {*} chartData: {date, ft1, ft2, etc}
 * @param {*} start: start date
 * @param {*} end: end date
 *
 * Returns:
 * {
 *  sources: []
 *  loads: []
 * }
 *
 * Also calculates total power, total energy and average prices
 * - totals include NETINTERCHANGE data
 */
export function generateSummaryData (data, start, end) {

  // Check if it is a valid fuel tech name
  function isValidFT (name) {
    return name !== 'date' &&
      name !== 'DEMAND_AND_NONSCHEDGEN' &&
      name !== 'price'
  }

  // Get only data between the start and end dates
  const filteredData = data.filter(item => {
    return moment(item.date).isBetween(start, end)
  })

  if (filteredData[0]) {
    const sourcesData = []
    const loadsData = []
    let totalPower = 0

    // create a new array with the ft totals
    const dataSum = filteredData.map((d, i) => {
      let p = 0
      Object.keys(d).forEach(ft => {
        if (isValidFT(ft)) {
          p += d[ft]
        }
      })
      return p
    })

    // sum up all the ft totals
    const dataSumTotal = dataSum.reduce((a, b) => { return a + b}, 0)

    // calculate the price * total
    const dataSumTotalPrice = dataSum.map((d, i) => {
      const rrp = filteredData[i]['price'] ? filteredData[i]['price'] : 0
      return d * rrp
    })

    // calculate the total average price
    const totalAveragePrice = dataSumTotalPrice.reduce((a, b) => a + b, 0) / dataSumTotal

    Object.keys(filteredData[0]).forEach(ft => {

      if (isValidFT(ft)) {
        // sum up each ft total
        const totalFTPower = filteredData.reduce((a, b) => {
          return a + b[ft]
        }, 0)
        totalPower += totalFTPower

        // calculate the price * ft total
        const dataFTPrice = filteredData.map((d, i) => {
          const rrp = filteredData[i]['price'] ? filteredData[i]['price'] : 0
          return d[ft] * rrp
        })

        // calculate the ft average price
        const averageFTPrice = dataFTPrice.reduce((a, b) => a + b, 0) / totalFTPower
        const row = {
          id: ft,
          range: {
            totalPower: totalFTPower,
            energy: totalFTPower / 12000,
            averagePrice: averageFTPrice
          }
        }

        // Split into loads and sources
        // - add Netinterchange into source because it contains both load and source data
        // if (ft === 'pumps' || ft === 'NETINTERCHANGE') {
        //   loadsData.push(row)
        // }
        if (ft !== 'pumps' && ft !== 'exports') {
          sourcesData.push(row)
        } else {
          loadsData.push(row)
        }
      }
    })

    return {
      sourcesData: sourcesData.reverse(),
      loadsData,
      totalPower,
      totalAveragePrice
    }
  } else {
    return {
      sourcesData: [],
      loadsData: [],
      totalPower: 0,
      totalAveragePrice: 0
    }
  }
}

export function generatePriceData (chartSeries, payload) {
  const priceData = [].concat(chartSeries)
  const rrp = payload['RRP']
  const rrpKey = 'RRP'
  const startDate = rrp.start
  const rrpData = rrp.data
  const start = moment(startDate, moment.ISO_8601)
  let duration
  try {
    duration = parseInterval(rrp.interval)
  } catch (e) {
    console.error(e)
  }

  let rrpIndex = 0
  priceData.forEach(item => {
    const now = moment(start).add(duration.value * rrpIndex, duration.key)
    if (item.date.toString() === now.toDate().toString()) {
      item[rrpKey] = rrpData[rrpIndex]
      rrpIndex++
    } else {
      item[rrpKey] = rrpData[rrpIndex - 1]
    }
  })

  /** negative price cannot be logathrmic **/
  // findDate[ftKey] = ftData[x] < 0 ? -ftData[x] : ftData[x]

  return priceData
}

export function sumRegionsFuelTech (regions) {
  let data = []
  Object.keys(regions).forEach((regionKey, regionIndex) => {
    const regionFtData = regions[regionKey]

    if (!data.length) {
      data = regionFtData.slice()
      data.forEach(d => {
        delete d.id
        delete d.region
      })
    } else {
      regionFtData.forEach(region => {
        const findFT = data.find(d => d.fuel_tech === region.fuel_tech)
        if (findFT) {
          const objData = findFT.history.data
          const srcData = region.history.data

          objData.forEach((value, index) => {
            objData[index] = value + srcData[index]
          })
        } else {
          delete region.id
          delete region.region
          data.push(region)
        }
      })
    }
  })

  return data.filter(d => {
    return d.fuel_tech !== 'pumps' & d.fuel_tech !== 'exports' & d.fuel_tech !== 'imports' & d.type !== 'price'
  })
}

/** Parse interval:
    - years = y
    - months = M
    - weeks = w
    - days = d
    - hours = h
    - minutes = m
    - seconds = s
**/
const durationKeys = ['y', 'M', 'w', 'd', 'h', 'm', 's']

/**
  returns {key, value}
  if string contains only key, value is 1
**/
function parseInterval (string) {
  const length = string.length
  const key = string.charAt(length - 1)
  const value = (length === 1) ? 1 : parseInt(string.substring(0, length - 1))

  if (durationKeys.includes(key)) {
    return {
      key,
      value
    }
  } else {
    throw `Invalid duration key: ${key}`
  }
}
