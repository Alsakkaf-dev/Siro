import { Button, EmptyState } from '../ui/ui.js';

export default function NotFound() {
  return <div className="page"><EmptyState icon="search" title="الصفحة غير موجودة" text="الرابط غير صحيح أو أن العنصر حُذف." action={<Button variant="primary" to="/">الرئيسية</Button>} /></div>;
}
