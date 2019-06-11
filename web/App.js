import * as React from 'react'
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs'
import "react-tabs/style/react-tabs.css"
import data from './data.json'
import { ReactGhLikeDiff } from 'react-gh-like-diff'
import 'react-gh-like-diff/lib/diff2html.min.css'
import ReactDiffViewer from 'react-diff-viewer'


const pathToString = (path) => {
  return path.map((e, i) => {
    if (Number.isInteger(e)) { return `[${e}]`}
    if (i > 0) { return `.${e}` }
    return e
  }).join('')
}

const DiffCollection = (props) => {
  const linkStyle = {
    fontFamily: 'monospace', fontSize: 16, margin: 10 
  }
  const links = props.diffs.map((obj, i) => {
      return <a key={obj.id} style={linkStyle} href={`#${obj.id}`}>{i + 1}</a>
    })

  const diffs = props.diffs.map((obj) => (
    <Diff key={obj.id} id={obj.id} split={props.split} lhs={obj.lhs} rhs={obj.rhs} />
  ))

  return (
    <div>
      {links}
      {diffs}
    </div>
  )
}

class Diff extends React.Component {
  render() {
    const split = this.props.split
    const spanStyle = {
      fontFamily: 'monospace',
      fontSize: 12,
    }
    return (
      <div style={{width: '100%', marginTop: 35}}>
        <span style={spanStyle}>
          Document id: <a name={this.props.id}>{this.props.id}</a>
        </span>
        <ReactDiffViewer
          hideLineNumbers={!split}
          oldValue={this.props.lhs}
          newValue={this.props.rhs}
          splitView={split}
        />
      </div>
    )
  }
}

const App = () => {
  const tabList = []
  const panels = []
  Object.keys(data).forEach((type) => {
    tabList.push(<Tab key={type}>{type}</Tab>)
    const added = data[type].added.map((o) => {
      return {
        id: o._id,
        lhs: "",
        rhs: JSON.stringify(o, 0, 2)
      }
    })

    const removed = data[type].removed.map((o) => {
      return {
        id: o._id,
        rhs: "",
        lhs: JSON.stringify(o, 0, 2)
      }
    })

    const changed = data[type].changed.map((diff) => {
      return {
        id: diff.lhs._id,
        lhs:  JSON.stringify(diff.lhs, 0, 2),
        rhs: JSON.stringify(diff.rhs, 0, 2),
      }
    })

    panels.push(
      <TabPanel key={`panels_${type}`}>
        <Tabs>
          <TabList>
              <Tab>New ({added.length})</Tab>
              <Tab>Removed ({removed.length})</Tab>
              <Tab>Changed ({changed.length})</Tab>
          </TabList>

        <div style={{height: '100%', overflowY: 'scroll'}}>
          <TabPanel>
            <DiffCollection diffs={added} split={false} />
          </TabPanel>
          <TabPanel>
            <DiffCollection diffs={removed} split={false} />
          </TabPanel>
          <TabPanel>
            <DiffCollection diffs={changed} split={true} />
          </TabPanel>
        </div>
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