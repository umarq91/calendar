import { ResetForm } from './form';
import { AuthHeading } from '../heading';

export const metadata = { title: 'set new password — invitewave' };

export default function ResetPage() {
  return (
    <div>
      <AuthHeading
        step="04 · new password"
        title="set a new password."
        underline="new"
        description="At least 8 characters."
      />
      <ResetForm />
    </div>
  );
}
