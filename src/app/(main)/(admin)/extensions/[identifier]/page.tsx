import { getDef } from '@/app/(main)/(admin)/extensions/utils';
import { baseRegistry } from '@/rag-spec/base';
import { notFound } from 'next/navigation';

export default async function Page ({ params }: { params: { identifier: string } }) {
  const identifier = decodeURIComponent(params.identifier);

  const def = getDef(identifier);

  if (!def) {
    notFound();
  }

  const ctor = await baseRegistry.getComponent(identifier);

  if (!ctor) {
    notFound();
  }

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-semibold">{ctor.displayName}</h1>
      {ctor.description && <article className="prose prose-sm prose-neutral dark:prose-invert overflow-x-hidden break-all">
        <ctor.description />
      </article>}
    </div>
  );
}

export const dynamic = 'force-dynamic';
