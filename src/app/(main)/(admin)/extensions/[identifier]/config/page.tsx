import type { ConfigProps } from '@/app/(main)/(admin)/extensions/[identifier]/config/common';
import { ConfigLoader } from '@/app/(main)/(admin)/extensions/[identifier]/config/ConfigLoader';
import { ConfigPrompting } from '@/app/(main)/(admin)/extensions/[identifier]/config/ConfigPrompting';
import { ConfigSplitter } from '@/app/(main)/(admin)/extensions/[identifier]/config/ConfigSplitter';
import { ExtensionCategory, getDef } from '@/app/(main)/(admin)/extensions/utils';
import { notFound } from 'next/navigation';

export default function Page ({ params }: { params: { identifier: string } }) {
  const identifier = decodeURIComponent(params.identifier);

  const def = getDef(identifier);

  if (!def) {
    notFound();
  }

  if (!def.configurable) {
    notFound();
  }

  const configProps: ConfigProps = {
    base: '/api/v1/indexes/default',
    identifier,
  };

  switch (def.category) {
    case ExtensionCategory.SPLITTER:
      return <ConfigSplitter {...configProps} />;
    case ExtensionCategory.PROMPTING:
      return <ConfigPrompting {...configProps} />;
    case ExtensionCategory.LOADER:
      return <ConfigLoader {...configProps} />;
    default:
      return 'Not implemented';
  }
}