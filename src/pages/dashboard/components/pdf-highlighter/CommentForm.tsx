import React, { useState } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';

interface CommentFormProps {
  onSubmit: (input: string) => void;
  placeHolder?: string;
}

const CommentForm = ({ onSubmit, placeHolder }: CommentFormProps) => {
  const [input, setInput] = useState<string>('');

  return (
    <Card className="w-full max-w-sm">
      <form
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit(input);
        }}
      >
        <CardContent className="pt-4">
          <Textarea
            placeholder={placeHolder || 'Add your comment here...'}
            autoFocus
            value={input}
            onChange={(event) => {
              setInput(event.target.value);
            }}
            className="min-h-24 resize-none"
          />
        </CardContent>
        <CardFooter className="flex justify-end gap-2">
          <Button type="submit" size="sm">
            Save
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};

export default CommentForm;
