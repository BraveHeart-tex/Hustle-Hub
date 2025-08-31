import { Button } from '@/components/ui/button';

function App() {
  const [message, setMessage] = useState('');
  return (
    <div className="flex flex-col gap-4 min-w-[300px]">
      <div className="flex items-center gap-2 flex-col">
        <h2 className="scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight first:mt-0">
          Hello World from PopUp!
        </h2>
        <p className="text-sm text-muted-foreground">
          {message ? message : 'Lorem ipsum dolor sit amet.'}
        </p>
      </div>
      <Button onClick={() => setMessage('Hello World')}>Hello World!</Button>
    </div>
  );
}

export default App;
