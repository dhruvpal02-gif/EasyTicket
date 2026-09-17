import { Loader2 } from 'lucide-react';

const PageLoader = ({ text = 'Loading...', fullScreen = true }) => {
  return (
    <div className={`flex flex-col items-center justify-center bg-gray-50 ${fullScreen ? 'min-h-screen' : 'py-12'}`}>
      <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mb-4" />
      {text && <p className="text-gray-500 font-medium">{text}</p>}
    </div>
  );
};

export default PageLoader;
