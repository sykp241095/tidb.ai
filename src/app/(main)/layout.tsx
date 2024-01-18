import { Nav, NavDrawer } from '@/app/(main)/nav';
import { SiteHeader } from '@/components/site-header';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { ReactNode } from 'react';

export default function Layout ({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen">
      <SiteHeader prefix={<NavDrawer />} />
      <div className="md:flex min-h-[calc(100vh-64px)]">
        <aside className="p-4 pr-0 flex-shrink-0 gap-4 w-80 hidden md:block h-[calc(100vh-80px)] sticky top-16">
          <ScrollArea className='h-full pr-4'>
            <Nav />
          </ScrollArea>
        </aside>
        <main className="flex-1">
          {children}
        </main>
      </div>
    </div>
  )
    ;
}