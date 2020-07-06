# TUTORIAL 04: implementing a matrix-layout custom report

Custom reports are a great way for analyzing and communicating Enterprise Architecture insights of your organization in an effective way.

In this step-by-step tutorial we create a [LeanIX](https://www.leanix.net/en/) custom report that demonstrates how to design a matrix-layout data visualization. More specifically, we'll display a matrix of applications vs their lifecycle phase start dates, if defined, as in the picture below.

<div style="display:flex; justify-content:center">
  <img src="https://i.imgur.com/DknXfoz.png">
</div>

The complete source-code for this project can be found [here](https://github.com/pauloramires/leanix-custom-report-tutorial-04).



## Pre-requisites

*  [NodeJS LTS](https://nodejs.org/en/) installed in your computer.

## Getting started

Install the [leanix-reporting-cli](https://github.com/leanix/leanix-reporting-cli) globally via npm:

```bash
npm install -g @leanix/reporting-cli
```

Initialize a new project:

```bash
mkdir leanix-custom-report-tutorial-04
cd leanix-custom-report-tutorial-04
lxr init
npm install
```
Configure your environment by editing the *lxr.json* file, if required:
```json
{
  "host": "app.leanix.net",
  "apitoken": "your-api-token-here"
}
```

After this procedure, you should end up with the following project structure:

<div  style="display:flex; justify-content:center">
  <img  src="https://i.imgur.com/OEIGHNo.png">
</div>

## Adjust the report boilerplate source code

We need to make some modifications in our project's boilerplate code. We start by adding the following dependecies:
```bash
npm install --dev @babel/plugin-transform-runtime postcss-loader
npm install alpinejs tailwindcss
```

 **Note:** During the course of this tutorial, we'll be using the [Alpine JS](https://github.com/alpinejs/alpine) and [Tailwind CSS](https://tailwindcss.com/) libraries.

After installing the dependencies, we modify the *webpack.config.js* file and include the *@babel/plugin-transform-runtime* and the *postcss-loader*, as indicated by the red arrows of the picture below:

<div  style="display:flex; justify-content:center;">
  <img  src="https://i.imgur.com/Vn0ZeWK.png">
</div>

 We then clean up our project source code by deleting the unnecessary files:
-  *src/report.js*
-  *src/fact-sheet-mapper.js*
-  *src/assets/\**

Next we create a *postcss.config.js* file in the *src* folder, with the following content:
```javascript
module.exports = {
  plugins: [
    require('tailwindcss'),
    require('autoprefixer')
  ]
}
```

Your project folder should look now like this:
<div  style="display:flex; justify-content:center">
<img  src="https://i.imgur.com/ol8RwCA.png">
</div>

Afterwards, edit the *index.js* file as follows, including the [Alpine JS](https://github.com/alpinejs/alpine), [Tailwind CSS](https://tailwindcss.com/) and [leanix-reporting](https://leanix.github.io/leanix-reporting/) dependencies.

```javascript
import 'alpinejs'
import '@leanix/reporting'
import 'tailwindcss/tailwind.css'

const state = {}

const methods = {
  async initializeReport () {
    console.log('initializing report')
  }
}

window.initializeContext = () => {
  return {
    ...state,
    ...methods
  }
}
```



And finally edit the *index.html* file as follows:

```html
<!doctype  html>
<html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="application-name" content="leanix-custom-report-tutorial-04">
    <meta name="description" content="Tutorial on how to implement a matrix-layout custom report">
    <meta name="author" content="LeanIX GmbH">
    <title>Tutorial 04: implementing a matrix-layout custom report</title>
    <style>
      [x-cloak] { display: none; }
    </style>
  </head>

  <body x-data="initializeContext()" x-init="initializeReport()">
    <div x-cloak class="container mx-auto h-screen"></div>
  </body>
</html>
```
As you may have noticed, we have declared two [Alpine JS](https://github.com/alpinejs/alpine#learn) directives in the <code>body</code> tag of our HTML code, the [x-data](https://github.com/alpinejs/alpine#x-data) and the [x-init](https://github.com/alpinejs/alpine#x-init). The  [x-data](https://github.com/alpinejs/alpine#x-data) directive calls the global method *initializeContext*, declared in the *index.js* file, and sets the scope for our report. More specifically, the [x-data](https://github.com/alpinejs/alpine#x-data) directive makes available to our AlpineJS instance all the variables and methods that are declared in the *state* and *methods* attributes of our *index.js* file. On the other hand, the [x-init](https://github.com/alpinejs/alpine#x-init) directive triggers the *initializeReport* method, defined in the *index.js* file, once the report is initialized.

Another detail which you may have noticed as well is the inclusion of an [x-cloak](https://github.com/alpinejs/alpine#x-cloak) directive on the first <code>div</code> child of the <code>body</code> tag of our html code. This directive is automatically removed by [Alpine JS](https://github.com/alpinejs/alpine) once the report is loaded, thus used as a technique for hiding the report elements until the report is fully loaded.

You may start the development server now by running the following command:
```bash
npm start
```
**Note!**

When you run *npm start*, a local webserver is hosted on *localhost:8080* that allows connections via HTTPS. But since just a development SSL certificate is created the browser might show a warning that the connection is not secure. You could either allow connections to this host anyways, or create your own self-signed certificate: https://www.tonyerwin.com/2014/09/generating-self-signed-ssl-certificates.html#MacKeyChainAccess.

If you decide to add a security exception to your localhost, make sure you open a second browser tab and point it to https://localhost:8080. Once the security exception is added to your browser, reload the original url of your development server and open the development console. Your should see a screen similar to the one below:
<div  style="display:flex; justify-content:center">
  <img  src="https://i.imgur.com/5LoJVX0.png">
</div>
Nothing very exciting happens here... However we notice that our report loads, and triggers the *initializeReport* method as expected!

## Report design
We want to implement a matrix-layout report which will show a list of applications that exist in our workspace versus the start date of each corresponding lifecycle phase, if defined.

We'll divide our report implementation into two parts: querying the workspace data and visualizing the results.

### Querying the workspace data
In order to build our application lifecycle matrix, we'll fetch from our workspace a list of applications using the [facet filter data fetching interface](https://leanix.github.io/leanix-reporting/interfaces/lxr.reportfacetsconfig.html) provided by the [leanix-reporting api](https://leanix.github.io/leanix-reporting/classes/lxr.lxcustomreportlib.html). We would like also to store the **baseUrl** of our workspace in a state variable, so that we can navigate later into the applications by clicking on them.
In order to do so, we'll include our **index.js** file two state variables, **baseUrl** and **applications**, and rewrite the **initializeReport** method as indicated below:

```javascript
import 'alpinejs'
import '@leanix/reporting'
import 'tailwindcss/tailwind.css'

// state variables definition...
const state = {
  // for our workspace's baseUrl...
  baseUrl: '',
  // and our applications list.
  applications: []
}

const methods = {
  async initializeReport () {
    const reportSetup = await lx.init()
    const { settings } = reportSetup
    const { baseUrl } = settings
    // store our workspace baseUrl in the state variable
    this.baseUrl = baseUrl

    const config = {
      // configure a facet filter facet for "Applications"
      facets: [
        {
          key: 1,
          fixedFactSheetType: 'Application',
          attributes: ['name', 'lifecycle {asString phases {phase startDate}}'],
          // store the list of workspace applications in the state variable as well after the report loads and on every facet filter change
          callback: applications => { this.applications = applications }
        }
      ]
    }

    lx.ready(config)
  },
}

window.initializeContext = () => {
  return {
    ...state,
    ...methods
  }
}
```

In order to take a peek at the application list that is being fetch from our workspace, we'll change the **body** tag of our *index.html* file as follows:

```html
  <body x-data="initializeContext()" x-init="initializeReport()">
    <div x-cloak class="container mx-auto h-screen">
      <template x-for="application in applications" :key="application.id">
        <div class="flex mb-2 text-xs">
          <div x-text="application.name" class="w-1/3 font-bold mr-6"></div>
          <div x-text="application.lifecycle ? lx.translateFieldValue('Application', 'lifecycle', application.lifecycle.asString) : 'n/a'"></div>
        </div>
      </template>
    </div>
  </body>
```

Your report should now be showing a list of application names and the current lifecycle phase, as in the picture below:
<div  style="display:flex; justify-content:center">
  <img  src="https://i.imgur.com/soxzmJ2.png">
</div>

Notice that this list is filterable, and it gets updated as soon as you set a new filtering criteria in the report facet.

Altough the list looks interesting, it is not however the matrix-view we aim to implement. Our matrix will have as columns the application name, and the set of lifecycle phases defined in our workspace. As we don't know yet which set is this of lifecycle phases that are defined in our workspace, we'll have to fetch the information as a graphql query using the [lx.executeGraphQL](https://leanix.github.io/leanix-reporting/classes/lxr.lxcustomreportlib.html#executegraphql) method provided by the [leanix-reporting api](https://leanix.github.io/leanix-reporting/classes/lxr.lxcustomreportlib.html). We'll also fetch the color metadata defined for each lifecycle phase in our workspace.
So edit our **index.js** file and add the **lifecyclePhases** state variable to the **state** object, and the **fetchLifecyclePhases** method to the **methods** object as ilustrated below:

```javascript
// index.js
const state = {
  baseUrl: '',
  applications: [],
  // the state variable that will hold the lifecycle phases existing in the workspace
  lifecyclePhases: []
}

const methods = {
  async initializeReport () {
    ...
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
    // we output the lifecyclePhases state variable to the console so that we can take a peek at the data
    console.log('lifecycle phases', this.lifecyclePhases)
  }
}
```

Afterwards we edit our **index.html** file so that the **fetchLifecyclePhases** is called as soon as the report loads, along with the **initializeReport** method. We do it so by editing the **x-init** directive of the **body** tag as follows:
```html
<!-- index.html -->
<body
  x-data="initializeContext()"
  x-init="() => {
    initializeReport()
    fetchLifecyclePhases()
  }">
  ...
</body>
```

Now launching the development server, and opening our browsers console, we can see the output of the **this.lifecyclePhases** state variable:
<div  style="display:flex; justify-content:center">
  <img  src="https://i.imgur.com/XRBIYSB.png">
</div>

Success! The **fetchLifecyclePhases** method in indeed being triggered upon the loading of the report and we have now the missing information for building our matrix-layout report that was the lifecycle phases defined in our workspace.

As we mentioned previously, our matrix report will have one column for the application name, and one to each lifecycle phase defined in our workspace, thus 6 columns in total.
Our next job in this tutorial will be to create a method that maps our application list into a set of matrix rows to be rendered in our matrix-layout report.

Edit the **index.js** file and add three new state variables - **headerRow**, **rows** and **gridStyle**, and the **computeRows** method as follows:

```javascript
// index.js

const state = {
  baseUrl: '',
  applications: [],
  lifecyclePhases: [],
  // the state variable that will hold the matrix top row containing the column headers/names
  headerRow: [],
  // the state variable that will hold our application rows
  rows: [],
  // will dynamically set the number of columns in our grid, based on the lifecycle phases fetched from workspace
  gridStyle: ''
}

const methods = {
  async initializeReport () {...
  },
  async fetchLifecyclePhases () {...
  },
  computeRows () {
    const lifecycleColumnKeys = this.lifecyclePhases.map(({ key }) => key)

    // the top row of our matrix containing the column names
    const headerRow = this.lifecyclePhases
      .reduce((accumulator, { key, label }) => {
        const { bgColor, color } = this.lifecyclePhases.find(({ key: refKey }) => refKey === key)
        accumulator.push({
          key,
          label,
          classes: 'text-center font-bold py-2',
          style: `color:${color};background:${bgColor}`
        })
        return accumulator
      }, [{ key: 'pivot-cell' }])

    // set the number of columns of our grid/matrix based on the number of lifecycle phases
    this.gridStyle = `grid-template-columns: 250px repeat(${this.headerRow.length - 1}, 150px)`

    // map the list of applications to lifecycle matrix rows
    const rows = this.applications
      .map(({ id, type, name, lifecycle }) => {
        // first column containing the name of the application
        const headerColumn = {
          key: id,
          type,
          label: name,
          classes: 'hover:underline cursor-pointer border-r font-bold py-2'
        }
        let lifecyclePhaseColumns = []
        // if application doesn't have a lifecycle defined
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
    // assign column names to the state variable this.headerRow
    this.headerRow = headerRow
    // assign our mapped rows to the state variable this.rows
    this.rows = rows
    console.log('computed rows', headerRow, rows)
  }
}
```

We want to compute the rows automatically whenever the lifecycle phase list is fetched from the workspace or the application list changes. In order to do so, we edit our **index.html** file and include two watchers in **x-init** directive of the **body** tag as follows:
```html
<!-- index.html -->
<body
  x-data="initializeContext()"
  x-init="() => {
    initializeReport()
    fetchLifecyclePhases()
    $watch('lifecyclePhases', () => computeRows())
    $watch('applications', () => computeRows())
  }">
  ...
</body>
```

If you observe the development console of your browser while reloading the report, you'll notice now the contents of the **headerRow** and the **rows** being shown after the report loads, on on every time the facet filter data changes.

<div style="display:flex; justify-content:center">
  <img  src="https://i.imgur.com/wfO4st6.png">
</div>


Now that we have our matrix rows being computed, we'll need to implement on additional method which will allow us to navigate to a certain application is the user clicks on its name. For that, edit again the **index.js** file and add the **applicationClickEvtHandler** method to the **methods** object as follows:
```javascript
// index.js
const methods = {
  async initializeReport () {...
  },
  async fetchLifecyclePhases () {...
  },
  computeRows () {...
  },
  applicationClickEvtHandler ({ type, key: id }) {
    const url = `${this.baseUrl}/factsheet/${type}/${id}`
    lx.openLink(url)
  }
}
```

And voilá! Since all the business logic of our report is in place, we can now proceed to the second part of this tutorial where we visualize the results in form of a matrix.


### Visualizing the results
In order to visualize our application lifecycle matrix, and since we have the data fetching business logic in place, all we need to do is to adjust the **body** tag of our **index.html** file according the following template:

```html
<html>
  ...
  <body
    x-data="initializeContext()"
    x-init="() => {
      initializeReport()
      fetchLifecyclePhases()
      $watch('lifecyclePhases', () => computeRows())
      $watch('applications', () => computeRows())
    }">
    <div x-cloak class="container mx-auto h-screen text-xs">
      <div class="flex flex-col items-center h-full overflow-hidden">
        <div class="grid border-b border-r" :style="gridStyle">
          <template
            x-for="cell in headerRow"
            :key="cell.key">
            <div
              x-text="cell.label"
              :class="cell.classes || ''"
              :style="cell.style"></div>
          </template>
        </div>
        <div class="h-full overflow-y-auto overflow-x-hidden" >
          <template
            x-for="(row, rowIdx) in rows"
            :key="rowIdx">
            <div
              class="grid border-r border-l hover:bg-gray-100 transition-colors duration-150 ease-in-out"
              :style="gridStyle">
              <template
                x-for="cell in row"
                :key="cell.key">
                <div
                  class="text-center border-r border-b"
                  :class="cell.classes || ''"
                  :style="cell.style || ''"
                  x-text="cell.label"
                  @click="applicationClickEvtHandler(cell)">
                </div>
              </template>
            </div>
          </template>
        </div>
      </div>
    </div>
  </body>
  ...
</html>
```

Now just run <code>npm start</code> to launch the development server again and contemplate the fruits of your labor!
<div style="display:flex; justify-content:center">
  <img src="https://i.imgur.com/fMsb97O.png">
</div>

Congratulations, you have finalized this tutorial!