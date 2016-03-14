import React, { Component } from "react-native";
import thunk from 'redux-thunk';
import { createStore, applyMiddleware } from "redux";
import { Provider } from "react-redux";
import reducers from "./reducers/index";

import NativeApp from "./containers/native";

const store = createStore(
  reducers,
  applyMiddleware(thunk)
);

export default class Main extends Component {
  render() {
    return (
      <Provider store={store}>
        <NativeApp />
      </Provider>
    )
  }
}
