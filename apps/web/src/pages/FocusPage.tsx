import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Play, Pause, Square } from 'lucide-react';

export default function FocusPage() {
  const [isRunning, setIsRunning] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [selectedTask, setSelectedTask] = useState<string | null>(null);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isRunning) {
      interval = setInterval(() => {
        setSeconds((s) => s + 1);
      }, 1000);
    } else if (interval) {
      clearInterval(interval);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning]);

  const formatTime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStop = () => {
    setIsRunning(false);
    setSeconds(0);
  };

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Focus Mode</h1>
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Timer</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center py-8">
              <div className="text-6xl font-mono font-bold">{formatTime(seconds)}</div>
            </div>
            <div className="flex justify-center gap-4">
              <Button
                onClick={() => setIsRunning(!isRunning)}
                size="lg"
              >
                {isRunning ? (
                  <>
                    <Pause className="h-4 w-4 mr-2" />
                    Pause
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    Start
                  </>
                )}
              </Button>
              <Button
                variant="destructive"
                onClick={handleStop}
                size="lg"
              >
                <Square className="h-4 w-4 mr-2" />
                Stop
              </Button>
            </div>
            <p className="text-center text-sm text-muted-foreground">
              Select a task to track time against it
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

