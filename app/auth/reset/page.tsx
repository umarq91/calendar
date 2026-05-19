import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ResetForm } from './form';

export const metadata = { title: 'Set new password — InviteWave' };

export default function ResetPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Set a new password</CardTitle>
        <CardDescription>Choose something at least 8 characters long.</CardDescription>
      </CardHeader>
      <CardContent>
        <ResetForm />
      </CardContent>
    </Card>
  );
}
