import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { createHashRouter, RouterProvider } from 'react-router-dom';
import DocsPage from './components/docs';

const supportedBasePaths = ['', '/Exornata', '/exornata', '/XRNA-React', '/xrna-react'] as const;

const joinBasePath = (
  basePath: (typeof supportedBasePaths)[number],
  suffix: '' | '/' | '/main' | '/main/*' | '/docs'
): string => {
  if (!basePath) {
    return suffix || '/';
  }
  if (!suffix || suffix === '/') {
    return basePath;
  }
  return `${basePath}${suffix}`;
};

const router = createHashRouter(
  supportedBasePaths.flatMap((basePath) => [
    {
      path: joinBasePath(basePath, '/'),
      element: <App.Component r2dtLegacyVersionFlag={true} />,
    },
    {
      path: joinBasePath(basePath, '/main'),
      element: <App.Component r2dtLegacyVersionFlag={false} />,
    },
    {
      path: joinBasePath(basePath, '/main/*'),
      element: <App.Component r2dtLegacyVersionFlag={false} />,
    },
    {
      path: joinBasePath(basePath, '/docs'),
      element: <DocsPage />,
    },
  ])
);

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
const docsPaths = new Set<string>(
  supportedBasePaths.map((basePath) => joinBasePath(basePath, '/docs'))
);

if (normalizedPublicUrl) {
  const normalizedPublicUrlPath = normalizedPublicUrl.startsWith('http')
    ? (() => {
        try {
          return new URL(normalizedPublicUrl).pathname;
        } catch {
          return '';
        }
      })()
    : normalizedPublicUrl;
  const trimmedPublicUrlPath =
    normalizedPublicUrlPath.length > 1 && normalizedPublicUrlPath.endsWith('/')
      ? normalizedPublicUrlPath.slice(0, -1)
      : normalizedPublicUrlPath;
  if (trimmedPublicUrlPath && trimmedPublicUrlPath !== '/') {
    docsPaths.add(`${trimmedPublicUrlPath}/docs`);
  }
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

reportWebVitals();