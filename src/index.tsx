import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { createHashRouter, RouterProvider } from 'react-router-dom';
import DocsPage from './components/docs';

const router = createHashRouter([
  {
    path: "/",
    element: <App.Component r2dtLegacyVersionFlag={true} />,
  },
  {
    path: "/main",
    element: <App.Component r2dtLegacyVersionFlag={false} />,
  },
  {
    path: "/main/*",
    element: <App.Component r2dtLegacyVersionFlag={false} />,
  },
  {
    path: "/docs",
    element: <DocsPage />,
  },
  {
    path: "/XRNA-React",
    element: <App.Component r2dtLegacyVersionFlag={true} />,
  },
  {
    path: "/XRNA-React/main",
    element: <App.Component r2dtLegacyVersionFlag={false} />,
  },
  {
    path: "/XRNA-React/docs",
    element: <DocsPage />,
  },
]);

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
const normalizedPathname = (() => {
  const { pathname } = window.location;
  if (pathname.length > 1 && pathname.endsWith('/')) {
    return pathname.slice(0, -1);
  }
  return pathname || '/';
})();

const publicUrl = process.env.PUBLIC_URL ?? "";
const normalizedPublicUrl = publicUrl.endsWith('/')
  ? publicUrl.slice(0, -1)
  : publicUrl;
const docsPaths = new Set<string>(['/docs']);
if (normalizedPublicUrl) {
  docsPaths.add(`${normalizedPublicUrl}/docs`);
}

root.render(
  <React.StrictMode>
    {docsPaths.has(normalizedPathname) ? (
      <DocsPage />
    ) : (
      <RouterProvider router={router} />
    )}
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();