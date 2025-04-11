import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Loader2,
  Undo2,
  ChevronUp,
  ChevronDown,
  UserCheck,
  Database
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from '@/components/ui/accordion';

// Import our fixed components
import TrainingSection from './golf/TrainingSection';
import VerificationSection from './golf/VerificationSection';
import * as fileService from '../../../services/file-service';

const BASE_URL = import.meta.env?.VITE_BASE_URL || 'http://localhost:5012';

export default function GolfSection() {
  const [currentGolferId, setCurrentGolferId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeAccordion, setActiveAccordion] = useState<string | null>(
    'verification'
  ); // Default to verification open
  const [isTrainingComplete, setIsTrainingComplete] = useState(false);
  const [canChangeGolferId, setCanChangeGolferId] = useState(true);

  // Handle training completion
  const handleTrainingComplete = () => {
    setIsTrainingComplete(true);
    setActiveAccordion('verification'); // Open verification after training
    setCanChangeGolferId(false); // Lock the golfer ID once training is complete
  };

  // Reset everything
  const resetAll = () => {
    if (window.confirm('This will reset all progress. Are you sure?')) {
      fileService.cleanup();
      setIsTrainingComplete(false);
      setActiveAccordion('verification'); // Start with verification open
      setError(null);
      setCanChangeGolferId(true);
    }
  };

  // Make sure golf ID is valid
  const validateGolferId = (id: string) => {
    // Allow letters, numbers, underscores and hyphens
    return /^[a-zA-Z0-9_-]+$/.test(id);
  };

  // Handle golfer ID change
  const handleGolferIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newId = e.target.value;

    // Only allow valid characters
    if (newId === '' || validateGolferId(newId)) {
      setCurrentGolferId(newId);
    }
  };

  // Handle accordion change
  const handleAccordionChange = (value: string) => {
    setActiveAccordion(value === activeAccordion ? null : value);
  };

  return (
    <div className="space-y-6">
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Golf Swing Verification System</CardTitle>
              <CardDescription>
                Train the system with new videos or verify swings against
                existing profiles
              </CardDescription>
            </div>
            {isTrainingComplete && (
              <Button variant="outline" size="sm" onClick={resetAll}>
                <Undo2 className="mr-2 h-4 w-4" />
                Reset System
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4">
            <Label htmlFor="golfer-id" className="min-w-[80px]">
              Golfer ID:
            </Label>
            <div className="flex-1">
              <Input
                id="golfer-id"
                value={currentGolferId}
                onChange={handleGolferIdChange}
                placeholder="Enter golfer ID (e.g., john_doe)"
                disabled={!canChangeGolferId}
                className={`${!canChangeGolferId ? 'opacity-70' : ''}`}
              />
              {!canChangeGolferId && (
                <p className="mt-1 text-xs text-muted-foreground">
                  Golfer ID is locked after training. Reset the system to change
                  it.
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription className="flex items-center justify-between">
            {error}
            <Button variant="outline" size="sm" onClick={() => setError(null)}>
              Dismiss
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <Accordion
        type="single"
        collapsible
        className="w-full"
        value={activeAccordion || undefined}
        onValueChange={handleAccordionChange}
      >
        {/* Verification Section - First in the UI */}
        <AccordionItem
          value="verification"
          className="mb-4 overflow-hidden rounded-lg border"
        >
          <AccordionTrigger className="bg-muted/40 px-4 py-3 transition-colors hover:bg-muted/60">
            <div className="flex items-center">
              <UserCheck className="mr-2 h-5 w-5 text-primary" />
              <span className="font-semibold">Verify Golfer Swing</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="p-0">
            <div className="pt-2">
              <VerificationSection
                golferId={currentGolferId}
                onBackToTraining={() => setActiveAccordion('training')}
              />
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Training Section - Second in the UI */}
        <AccordionItem
          value="training"
          className="overflow-hidden rounded-lg border"
        >
          <AccordionTrigger className="bg-muted/40 px-4 py-3 transition-colors hover:bg-muted/60">
            <div className="flex items-center">
              <Database className="mr-2 h-5 w-5 text-primary" />
              <span className="font-semibold">Train New Golfer Profile</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="p-0">
            <div className="pt-2">
              <TrainingSection
                golferId={currentGolferId}
                onTrainingComplete={handleTrainingComplete}
                isTrainingComplete={isTrainingComplete}
              />
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {loading && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/50">
          <div className="mb-4">
            <Loader2 className="h-12 w-12 animate-spin text-white" />
          </div>
          <p className="text-lg font-semibold text-white">Processing...</p>
        </div>
      )}
    </div>
  );
}
