import React from 'react';
import DiffView from './DiffView'
import { BrowserRouter as Router, Route, Switch } from "react-router-dom";

function App() {
  return (
    <Router>
      <Switch>
        <Route path="/:type/:action" component={DiffView} />
        <Route path="/:type" component={DiffView} />
        <Route exact path="/" component={DiffView} />
      </Switch>
    </Router>
  );
}

export default App