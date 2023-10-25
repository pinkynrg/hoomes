import { Navigate, createBrowserRouter } from 'react-router-dom'
import { Listing } from './pages/Listing/Listing'
import { Layout } from './components/Layout/Layout'

const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      {
        path: '/listing',
        element: <Listing />,
      },
      {
        path: '/',
        element: <Navigate to="/listing" replace />,
      },
      {
        path: '*',
        element: <Navigate to="/" replace />,
      },
    ]
  }
])

export { router }
