import './App.css';
import { QueryClient, QueryClientProvider } from 'react-query';
import { HomesList } from './components/HomesList/HomesList'

const queryClient = new QueryClient();


const App = () => (
  <QueryClientProvider client={queryClient}>
    <HomesList/>
  </QueryClientProvider>
)

export default App;
