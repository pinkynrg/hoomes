import { RouterProvider } from 'react-router-dom'
import { ConfigProvider, theme } from 'antd'
import itIT from 'antd/locale/it_IT'
import { router } from './router'

const hoomesTheme = {
  algorithm: theme.defaultAlgorithm,
  token: {
    colorPrimary: '#ad4e28',
    colorInfo: '#ad4e28',
    colorLink: '#ad4e28',
    colorSuccess: '#63713a',
    colorWarning: '#d99e32',
    colorError: '#c02a2a',
    colorText: '#372b21',
    colorTextSecondary: '#7a6a5c',
    colorTextPlaceholder: '#95867a',
    colorBorder: '#e8ded2',
    colorBgContainer: '#ffffff',
    borderRadius: 10,
    controlHeight: 40,
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    fontSize: 15,
    lineWidth: 1,
  },
  components: {
    Button: {
      fontWeight: 500,
      primaryShadow: 'none',
      defaultShadow: 'none',
    },
    Input: {
      paddingBlock: 8,
    },
    Progress: {
      defaultColor: '#ad4e28',
    },
    Segmented: {
      itemSelectedBg: '#ad4e28',
      itemSelectedColor: '#ffffff',
    },
  },
}

const App = () => (
  <ConfigProvider theme={hoomesTheme} locale={itIT}>
    <RouterProvider router={router} />
  </ConfigProvider>
)

export { App }
