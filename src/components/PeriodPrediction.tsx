import React, { useState, useEffect } from 'react';
import { Calendar, TrendingUp, Heart, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { 
  calculatePeriodPrediction, 
  getPredictionText, 
  formatPredictionSummary,
  getDaysUntilNextPeriod,
  isInFertileWindow,
  type PredictionData,
  type CycleData,
  type UserProfile 
} from '@/utils/periodPrediction';
import { format } from 'date-fns';

interface PeriodPredictionProps {
  profile: UserProfile | null;
}

export const PeriodPrediction: React.FC<PeriodPredictionProps> = ({ profile }) => {
  const { user } = useAuth();
  const [prediction, setPrediction] = useState<PredictionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [cycles, setCycles] = useState<CycleData[]>([]);

  useEffect(() => {
    const fetchCyclesAndPredict = async () => {
      if (!user?.id || !profile) {
        setLoading(false);
        return;
      }

      try {
        // Fetch user's cycle history
        const { data: cyclesData, error } = await supabase
          .from('cycles')
          .select('start_date, end_date, cycle_length, period_length')
          .eq('user_id', user.id)
          .order('start_date', { ascending: false })
          .limit(12); // Get last 12 cycles for better prediction

        if (error) {
          console.error('Error fetching cycles:', error);
          return;
        }

        setCycles(cyclesData || []);
        
        // Calculate prediction using historical data
        const predictionResult = calculatePeriodPrediction(cyclesData || [], profile);
        setPrediction(predictionResult);
      } catch (error) {
        console.error('Error in prediction calculation:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCyclesAndPredict();
  }, [user?.id, profile]);

  if (loading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Period Prediction
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!prediction) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Period Prediction
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Add your last period date to get predictions
          </p>
        </CardContent>
      </Card>
    );
  }

  const daysUntil = getDaysUntilNextPeriod(prediction.nextPeriodDate);
  const inFertileWindow = isInFertileWindow(prediction.fertileWindow);
  const confidenceColor = prediction.confidence >= 70 ? 'bg-green-500' : 
                         prediction.confidence >= 50 ? 'bg-yellow-500' : 'bg-red-500';

  return (
    <div className="space-y-4">
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Next Period Prediction
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center p-4 bg-muted/50 rounded-lg">
            <div className="text-2xl font-bold text-primary">
              {formatPredictionSummary(prediction)}
            </div>
            <div className="text-sm text-muted-foreground mt-1">
              {format(prediction.nextPeriodDate, 'EEEE, MMMM do, yyyy')}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Prediction Confidence</span>
            <Badge variant="outline" className="gap-1">
              <div className={`w-2 h-2 rounded-full ${confidenceColor}`} />
              {prediction.confidence}% - {getPredictionText(prediction.confidence)}
            </Badge>
          </div>
          
          <Progress value={prediction.confidence} className="h-2" />

          {cycles.length > 0 && (
            <div className="text-xs text-muted-foreground">
              Based on {cycles.length} recorded cycle{cycles.length !== 1 ? 's' : ''}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5" />
            Fertility Window
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm">Fertile Period</span>
            <Badge variant={inFertileWindow ? "default" : "secondary"}>
              {inFertileWindow ? "Active Now" : "Upcoming"}
            </Badge>
          </div>
          
          <div className="text-sm space-y-1">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Start:</span>
              <span>{format(prediction.fertileWindow.start, 'MMM dd')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">End:</span>
              <span>{format(prediction.fertileWindow.end, 'MMM dd')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Ovulation:</span>
              <span>{format(prediction.ovulationDate, 'MMM dd')}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Cycle Statistics
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-muted-foreground">Average Cycle</div>
              <div className="font-medium">{prediction.averageCycleLength} days</div>
            </div>
            <div>
              <div className="text-muted-foreground">Period Length</div>
              <div className="font-medium">{prediction.predictedPeriodLength} days</div>
            </div>
            <div>
              <div className="text-muted-foreground">Variability</div>
              <div className="font-medium">±{Math.round(prediction.cycleVariability)} days</div>
            </div>
            <div>
              <div className="text-muted-foreground">Data Points</div>
              <div className="font-medium">{cycles.length} cycles</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};