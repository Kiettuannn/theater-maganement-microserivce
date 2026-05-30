import type { ThemeConfig } from 'antd';

const theme: ThemeConfig = {
  token: {
    colorPrimary: '#0052A3',
    colorSuccess: '#10B981',
    colorWarning: '#F59E0B',
    colorError: '#EF4444',
    colorInfo: '#3B82F6',
    colorTextBase: '#1F2937',
    colorBgBase: '#FFFFFF',
    borderRadius: 8,
    fontFamily: `-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif`,
  },
  components: {
    Button: {
      colorPrimary: '#0052A3',
      controlHeight: 40,
      fontSize: 16,
    },
    Input: {
      controlHeight: 40,
      fontSize: 16,
    },
    Select: {
      controlHeight: 40,
      fontSize: 16,
    },
    DatePicker: {
      controlHeight: 40,
      fontSize: 16,
    },
    Card: {
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
    },
  },
};

export default theme;
