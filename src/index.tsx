import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { createHashRouter, HashRouter, Route, RouterProvider, Routes } from 'react-router-dom';

const router = createHashRouter([
  {
    path: "/",
    element: <App.Component
      r2dtLegacyVersionFlag = {true}
    />,
  },
  {
    path: "/main/*",
    element : <App.Component
      r2dtLegacyVersionFlag = {false}
    />
  }
]);

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
root.render(
  <React.StrictMode>
    <HashRouter>
      <Routes>
        <Route
          path = "/XRNA-React/main"
          element = {<App.Component
            r2dtLegacyVersionFlag = {false}
          />}
        />
        <Route
          path = "/XRNA-React"
          element = {<App.Component
            r2dtLegacyVersionFlag = {true}
          />}
        />
        <Route
          path = "/main"
          element = {<App.Component
            r2dtLegacyVersionFlag = {false}
          />}
        />
        <Route
          path = "/"
          element = {<App.Component
            r2dtLegacyVersionFlag = {true}
          />}
        />
      </Routes>
    </HashRouter>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();