import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { CheckCircle, XCircle, RefreshCw } from 'lucide-react';

interface ResultsSectionProps {
  results: any | null;
  onReset: () => void;
}

const ResultsSection: React.FC<ResultsSectionProps> = ({
  results,
  onReset
}) => {
  if (!results) {
    return (
      <div className="py-8 text-center">
        <p className="text-muted-foreground">No results available yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Identification Results</h2>
        <Button variant="outline" onClick={onReset}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Start New Session
        </Button>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-lg">
              Overall Accuracy:{' '}
              <span className="font-bold">
                {(results.overall_accuracy * 100).toFixed(2)}%
              </span>{' '}
              ({results.correct_identifications}/{results.total_swings})
            </p>

            <h3 className="mb-3 text-lg font-medium">Accuracy by Golfer</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Golfer</TableHead>
                  <TableHead>Accuracy</TableHead>
                  <TableHead>Count</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Object.entries(results.golfer_accuracy).map(
                  ([golfer, stats]: [string, any]) => (
                    <TableRow key={golfer}>
                      <TableCell className="font-medium">{golfer}</TableCell>
                      <TableCell>
                        {(stats.accuracy * 100).toFixed(2)}%
                      </TableCell>
                      <TableCell>{stats.count}</TableCell>
                    </TableRow>
                  )
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <h3 className="mb-4 mt-8 text-xl font-medium">Detailed Results</h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {results.results.map((result: any, index: number) => (
            <Card
              key={index}
              className={`overflow-hidden border-l-4 ${
                result.is_correct ? 'border-l-green-500' : 'border-l-red-500'
              }`}
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-base">Swing {index + 1}</CardTitle>
                  {result.is_correct ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-500" />
                  )}
                </div>
                <p className="font-mono text-xs text-muted-foreground">
                  {result.csv_file}
                </p>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-xs text-muted-foreground">True Golfer</p>
                    <p className="font-semibold">{result.true_golfer}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">
                      Identified As
                    </p>
                    <p className="font-semibold">{result.identified_golfer}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-xs text-muted-foreground">Confidence</p>
                    <div className="mt-1 h-2.5 w-full rounded-full bg-muted">
                      <div
                        className="h-2.5 rounded-full bg-primary"
                        style={{ width: `${result.confidence * 100}%` }}
                      ></div>
                    </div>
                    <p className="mt-1 text-right text-xs">
                      {(result.confidence * 100).toFixed(2)}%
                    </p>
                  </div>
                </div>

                <div>
                  <h4 className="mb-2 text-xs font-medium text-muted-foreground">
                    Top Matches:
                  </h4>
                  <ul className="space-y-1 text-xs">
                    {result.top_matches.map((match: any, idx: number) => (
                      <li
                        key={idx}
                        className={`flex items-center justify-between rounded-sm px-2 py-1 ${
                          match.golfer_id === result.true_golfer
                            ? 'bg-green-50 font-medium text-green-700'
                            : 'bg-muted'
                        }`}
                      >
                        <span>
                          {idx + 1}. {match.golfer_id}
                        </span>
                        <span className="font-mono">
                          {match.distance.toFixed(4)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ResultsSection;
