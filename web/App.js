import * as React from 'react'
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs'
import "react-tabs/style/react-tabs.css"
import data from './data.json'
import { ReactGhLikeDiff } from 'react-gh-like-diff'
import 'react-gh-like-diff/lib/diff2html.min.css'

const pathToString = (path) => {
  return path.map((e, i) => {
    if (Number.isInteger(e)) { return `[${e}]`}
    if (i > 0) { return `.${e}` }
    return e
  }).join('')
}

const DiffDetailView = (props) => {
  const { path } = props
  const { lhr, rhs } = props
  return (
    <ReactGhLikeDiff
        options={{
          originalFileName: pathToString(path),
          updatedFileName: pathToString(path),
          outputFormat: 'line-by-line',
          matching: 'lines'
        }}
        past={props.lhs !== undefined ? JSON.stringify(props.lhs, 0, 2) : ""}
        current={props.rhs !== undefined ? JSON.stringify(props.rhs, 0, 2): ""}
      />
  )
}

class DiffView extends React.Component {
  constructor(props) {
    super(props)

    this.toggleOpen = this.toggleOpen.bind(this)

    this.state = {
      isOpen: false
    }
  }

  toggleOpen() {
    if (this.state.isOpen) {
      this.setState({ isOpen: false })
    } else {
      this.setState({ isOpen: true })
    }
  }

  render() {
    const { props } = this
    const { isOpen } = this.state
    const diffs = isOpen ? props.diff.map(d => <DiffDetailView {...d} />) : null
    return (
      <div>
        <h1>{props.id}</h1>
        <button onClick={this.toggleOpen}>{isOpen ? 'Close' : 'Open'}</button>
        { diffs }
      </div>
    )
  }
}

const App = () => {
  const tabList = []
  const panels = []
  Object.keys(data).forEach((type) => {
    tabList.push(<Tab key={type}>{type}</Tab>)
    panels.push(
      <TabPanel key={`panels_${type}`}>
        <Tabs>
          <TabList>
              <Tab>New ({data[type].added.length})</Tab>
              <Tab>Removed ({data[type].removed.length})</Tab>
              <Tab>Changed ({data[type].changed.length})</Tab>
          </TabList>

          <TabPanel>
            <ul>
              {data[type].added.map(id => (<li key={id}>{id}</li>))}
            </ul>
          </TabPanel>
          <TabPanel>
            <ul>
              {data[type].removed.map(id => (<li key={id}>{id}</li>))}
            </ul>
          </TabPanel>
          <TabPanel>
            {data[type].changed.map((changed) => {
              return (
                <DiffView id={changed.id} diff={changed.diff} />
              )
            })}
          </TabPanel>
        </Tabs>
      </TabPanel>
    )
  })

  return (
    <div>
      <Tabs>
        <TabList>
          {tabList}
        </TabList>
        {panels}
      </Tabs>
    </div>
  )
}

export default App