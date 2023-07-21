import textToSpeech from '@/pages/api/Text2Speech';
import {
  IconDownload,
  IconLoader,
  IconPlayerPause,
  IconPlayerPlay
} from '@tabler/icons-react';
import {
  useState,
  useEffect,
  useRef,
  useCallback
} from 'react';
interface Props {
  content: string;
}

export const Text2Speech = ({
    content
  }: Props) => {
    const [audioURL, setAudioURL] = useState<string|null>(null);
    const [isPlaying, setIsPlaying] = useState<boolean>(false);
    const [duration, setDuration] = useState<number | undefined>(0);
    const [currentTime, setCurrentTime] = useState<number | undefined>(0);
    const [isDownload, setIsDownload] = useState<boolean>(false);
    const [loading, setLoading] = useState<boolean>(false);
    const audioRef = useRef<HTMLAudioElement>(null)

    const handleAudioFetch = async () => {
        setLoading(true);
        const data = await textToSpeech(content);
        const blob = new Blob([data], { type: 'audio/mpeg' });
        const url = URL.createObjectURL(blob);
        setAudioURL(url);
        setLoading(false);
    };
  
    const handlePlayPause = () => {
      if(!audioURL) {
        handleAudioFetch();
      }
      setIsPlaying(!isPlaying);
    }

    const handleEnded = () => {
    }

    const calculateTime = (sec: number | undefined) => {
      if(sec) {
        const minutes = Math.floor(sec / 60)
        const newMinutes = minutes < 10 ? `0${minutes}` : `${minutes}`
        const seconds = Math.floor(sec % 60)
        const newSeconds = seconds < 10 ? `0${seconds}` : `${seconds}`
  
        return `${newMinutes}:${newSeconds}`
      }
      return "00:00";
    }   

    const handleDownload = () => {
      setIsDownload(true);
      if(!audioURL)
        handleAudioFetch();
    }

    const downloadAudio = useCallback(
      () => {
      if (audioURL)
      fetch(audioURL)
        .then((response) => {
          return response.blob()
        })
        .then((data) => {
          var a = document.createElement("a");
          a.href = window.URL.createObjectURL(data);
          a.download = 'audio';
          a.click();
        });
    },
    [audioURL]
    );

    useEffect(() => {
      let interval: any = null;
      if (isPlaying){
        interval = setInterval(() => {          
          if(!duration && audioRef.current?.currentTime) {
            setDuration(audioRef.current?.duration);
          }
          setCurrentTime(audioRef.current?.currentTime); 
          if(audioRef.current?.currentTime === audioRef.current?.duration) {
            setIsPlaying(false);
            setCurrentTime(0);                                    
            clearInterval(interval);
          }
                                     
      }, 1000);  
      }   
      return () => {
        clearInterval(interval);
      }; 
    }, [isPlaying, duration]);

    useEffect(() => {
      if(audioURL) {
        isPlaying ? audioRef.current?.play() : audioRef.current?.pause();
      }
    }, [audioURL, isPlaying]);

    useEffect(() => {
      if(audioURL && isDownload) {
          setIsDownload(false);
          downloadAudio();
      }
    }, [audioURL, isDownload, downloadAudio]);

    return(
        <div className='flex items-center hover:cursor-pointer'>
          <button onClick={handlePlayPause}>
            {
              loading ?
              <IconLoader className='animate-spin' size={14}/>
              :
              (
                isPlaying ? 
                <IconPlayerPause size={14} /> 
                : 
                <IconPlayerPlay size={14} />
              )
            }
            </button>
          <div className='text-sm ml-2'>
            {currentTime ? calculateTime(currentTime) : '00:00'}
            {duration ? `/${calculateTime(duration)}` : ''}
          </div>
            <button className='ml-3 hidden group-hover:block' onClick={handleDownload}><IconDownload size={16} /> </button>
          <audio src={audioURL ? audioURL : ""} ref={audioRef} autoPlay onEnded={handleEnded} />
      </div>
    );
};






  