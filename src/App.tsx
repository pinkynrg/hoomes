import { QueryClient, QueryClientProvider } from 'react-query';
import { HomesList } from './components/HomesList/HomesList'
import { EmptyState } from './components/EmptyState/EmptyState';
import style from './App.module.scss';
import { useState } from 'react';

const queryClient = new QueryClient();


const App = () => {
  const [url, setUrl] = useState<string | undefined>()
  return (
    <QueryClientProvider client={queryClient}>
      <div className={style.App}>
        <HomesList onPreview={setUrl}/>
        <EmptyState href={url ? 'http://localhost:5000/v1/proxy?url=' + url : undefined}/>
      </div>
    </QueryClientProvider>
  )
}

export default App;
