import * as React from 'react'
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs'
import { Redirect, Link } from 'react-router-dom'
import "react-tabs/style/react-tabs.css"
import data from './data.json'
import { ReactGhLikeDiff } from 'react-gh-like-diff'
import 'react-gh-like-diff/lib/diff2html.min.css'
import './DiffView.css'

const DiffCollection = (props) => {
  const diffs = props.diffs.map((obj) => (
    <Diff
      key={obj.id}
      type={obj.type}
      flags={props.flags}
      id={obj.id}
      split={props.split}
      lhs={obj.lhs}
      rhs={obj.rhs} />
  ))

  return (
    <div>
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
      <div className="Diff">
        <a name={id} />
        <div id="EditorLinksContainer">
          <div className="EditorLink">
            {urlA && (
              <p class="">
                <a href={`${urlA}/intent/edit/id=${id};type=${type}`} target="lhs">Open old in editor</a>
              </p>
            )}
          </div>
          <div className="EditorLink">
            {urlB && (
              <p>
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

const DiffView = ({match}) => {
  const { params } = match
  const { objects, flags } = data

  const actions = ['added', 'removed', 'changed']

  const types = Object.keys(objects)
  if (!params.type || types.indexOf(params.type) < 0) {
    params.type = types[0]
    params.action = 'added'
  }

  let diffs = []
  switch (params.action) {
    case 'added':
      diffs = objects[params.type].added.map((o) => {
        return {
          id: o._id,
          type: o._type,
          lhs: '',
          rhs: JSON.stringify(o, 0, 2)
        }
      })
      break
    case 'removed':
      diffs = objects[params.type].removed.map((o) => {
        return {
          id: o._id,
          type: o._type,
          rhs: '',
          lhs: JSON.stringify(o, 0, 2)
        }
      })
      break
    case 'changed':
      diffs = objects[params.type].changed.map((diff) => {
        return {
          id: diff.lhs._id,
          type: diff.lhs._type,
          lhs:  JSON.stringify(diff.lhs, 0, 2),
          rhs: JSON.stringify(diff.rhs, 0, 2),
        }
      })
      break
    default:
      break
  }

  const typeLinks = types.map(type => {
    const count = objects[type].added.length + objects[type].removed.length + objects[type].changed.length
    let link = null
    if (type === params.type) {
      link = <strong>{type} ({count})</strong>
    } else {
      link = (
        <div>
          <Link to={`/${type}/added`}>{type}</Link>
          <span> ({count})</span>
        </div>
      )
    }
    return (
      <div key={type}>
        {link}
      </div>
    )
  })

  const actionLinks = actions.map(action => {
    const count = objects[params.type][action].length
    let link = null
    if (action === params.action) {
      link = <strong>{action} ({count})</strong>
    } else {
      link = (
        <div>
          <Link to={`/${params.type}/${action}`}>{action}</Link>
          <span> ({count})</span>
        </div>
      )
    }
    return (
      <div key={action}>
        {link}
      </div>
    )
  })

  return (
    <div style={{marginTop: '20px'}}>
      <div className="Grid">
        {typeLinks}
      </div>
      <hr />
      <div className="Grid">
        {actionLinks}
      </div>
      <hr />
      <div id="diffcontainer">
        <DiffCollection flags={flags} diffs={diffs} split={false} />
      </div>
    </div>
  )
}

export default DiffView