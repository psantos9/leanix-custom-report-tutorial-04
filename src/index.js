import 'alpinejs'
import '@leanix/reporting'
import 'tailwindcss/tailwind.css'

const state = {
  baseUrl: '',
  gridStyle: '',
  lifecyclePhases: [],
  applications: [],
  headerRow: [],
  rows: []
}

const methods = {
  async initializeReport () {
    const reportSetup = await lx.init()
    const { settings } = reportSetup
    const { baseUrl } = settings
    this.baseUrl = baseUrl
    console.debug('report setup', reportSetup)
    const config = {
      facets: [
        {
          key: 1,
          // fixedFactSheetType: 'Application',
          attributes: ['id', 'type', 'name'],
          callback: dataset => {
            console.log('DATASET', dataset)
          },
          // fixedFactSheetType: 'Application',
          defaultFilters: [
            // { facetKey: 'Subscriptions', operator: 'OR', keys: ['__me__'] }
            { facetKey: 'FactSheetTypes', keys: ['Application'] }
          ]
        }
      ]
    }
    lx.ready(config)
  },
  async fetchLifecyclePhases () {
    const query = `
      {
        allFactSheets(factSheetType: Application) {
          filterOptions{
            facets{
              facetKey
              results{
                key
              }
            }
          }
          view(key:"lifecycle"){
            legendItems{
              bgColor
              color
              value
            }
          }
        }
      }
    `
    const lifecyclePhases = await lx.executeGraphQL(query)
      .then(({ allFactSheets }) => {
        const { filterOptions, view } = allFactSheets
        let { legendItems } = view
        legendItems = legendItems
          .reduce((accumulator, { bgColor, color, value }) => ({ ...accumulator, [value]: { bgColor, color } }), {})
        const lifecyclePhases = filterOptions.facets.find(({ facetKey }) => facetKey === 'lifecycle').results
          .filter(({ key }) => ['__any__', '__missing__'].indexOf(key) < 0)
          .map(({ key }) => ({ key, label: lx.translateFieldValue('Application', 'lifecycle', key), ...legendItems[key] }))
        return lifecyclePhases
      })
    this.lifecyclePhases = lifecyclePhases
  },
  computeRows () {
    const lifecycleColumnKeys = this.lifecyclePhases.map(({ key }) => key)

    this.headerRow = this.lifecyclePhases
      .reduce((accumulator, { key, label }) => {
        const { bgColor, color } = this.lifecyclePhases.find(({ key: refKey }) => refKey === key)
        const classes = 'text-center font-bold py-2'
        accumulator.push({ key, label, classes, style: `color:${color};background:${bgColor}` })
        return accumulator
      }, [{ key: 'pivot-cell' }])

    this.gridStyle = `grid-template-columns: 250px repeat(${this.headerRow.length - 1}, 150px)`

    const rows = this.applications
      .map(({ id, type, name, lifecycle }) => {
        const headerColumn = {
          key: id,
          type,
          label: name,
          classes: 'hover:underline cursor-pointer border-r font-bold py-2'
        }
        let lifecyclePhaseColumns = []
        if (lifecycle === null) lifecyclePhaseColumns = lifecycleColumnKeys.map(key => ({ key: `${id}_${key}`, label: null, classes: 'border-r last:border-r-0' }))
        else {
          let { asString, phases } = lifecycle
          const { bgColor, color } = this.lifecyclePhases.find(({ key }) => key === asString)
          phases = phases.reduce((accumulator, { phase, startDate }) => {
            accumulator[phase] = startDate
            return accumulator
          }, {})
          lifecyclePhaseColumns = lifecycleColumnKeys.map(key => ({
            key: `${id}_${key}`,
            label: phases[key] || null,
            classes: `border-r last:border-r-0 py-2`,
            style: key === asString ? `color:${color};background:${bgColor}80` : ''
          }))
          headerColumn.style = `color:${color};background:${bgColor}`
        }
        return [headerColumn, ...lifecyclePhaseColumns]
      })
    this.rows = rows
  },
  applicationClickEvtHandler ({ type = null, key: id }) {
    if (type === null) return
    const url = `${this.baseUrl}/factsheet/${type}/${id}`
    lx.openLink(url)
  }
}

window.initializeContext = () => ({
  ...state,
  ...methods
})