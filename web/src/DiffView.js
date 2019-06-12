import * as React from 'react'
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs'
import "react-tabs/style/react-tabs.css"
import data from './data.json'
import { ReactGhLikeDiff } from 'react-gh-like-diff'
import 'react-gh-like-diff/lib/diff2html.min.css'
import './DiffView.css'

const DiffCollection = (props) => {
  const linkStyle = {
    fontFamily: 'monospace', fontSize: 16, margin: 10 
  }
  const links = props.diffs.map((obj, i) => {
      return <a key={obj.id} style={linkStyle} href={`#${obj.id}`}>{i + 1}</a>
    })

  const diffs = props.diffs.map((obj) => (
    <Diff
      type={obj.type}
      flags={props.flags}
      key={obj.id}
      id={obj.id}
      split={props.split}
      lhs={obj.lhs}
      rhs={obj.rhs} />
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
    const { id, type, lhs, rhs, flags } = this.props
    const options = {
      outputFormat: 'side-by-side',
      originalFileName: id,
      updatedFileName: id,
    }

    const added = lhs === ''
    const removed = rhs === ''

    const urlA = !added && flags.studioUrlA 
    const urlB = !removed && flags.studioUrlB

    return (
      <div class="Diff">
        <a name={id} />
        <div id="EditorLinksContainer">
          <div class="EditorLink">
            {urlA && (
              <p class="">
                <a href={`${urlA}/intent/edit/id=${id};type=${type}`} target="lhs">Open old in editor</a>
              </p>
            )}
          </div>
          <div class="EditorLink">
            {urlB && (
              <p class="">
                <a href={`${urlB}/intent/edit/id=${id};type=${type}`} target="rhs">Open new in editor</a>
              </p>
            )}
          </div>
        </div>
        <ReactGhLikeDiff 
          past={lhs}
          current={rhs}
          options={options}
        />
      </div>
    )
  }
}

const DiffView = () => {
  const tabList = []
  const panels = []
  const { objects, flags } = data
  Object.keys(objects).forEach((type) => {
    tabList.push(<Tab key={type}>{type}</Tab>)
    const added = objects[type].added.map((o) => {
      return {
        id: o._id,
        type: o._type,
        lhs: '',
        rhs: JSON.stringify(o, 0, 2)
      }
    })

    const removed = objects[type].removed.map((o) => {
      return {
        id: o._id,
        type: o._type,
        rhs: '',
        lhs: JSON.stringify(o, 0, 2)
      }
    })

    const changed = objects[type].changed.map((diff) => {
      return {
        id: diff.lhs._id,
        type: diff.lhs._type,
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

        <div id="diffcontainer">
          <TabPanel>
            <DiffCollection flags={flags} diffs={added} split={false} />
          </TabPanel>
          <TabPanel>
            <DiffCollection flags={flags} diffs={removed} split={false} />
          </TabPanel>
          <TabPanel>
            <DiffCollection flags={flags} diffs={changed} split={true} />
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

export default DiffView