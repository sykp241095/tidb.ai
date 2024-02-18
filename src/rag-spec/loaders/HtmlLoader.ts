import { rag } from '@/core/interface';
import { md5 } from '@/lib/digest';
import { createUrlMatcher } from '@/lib/url-matcher';
import { htmlSelectorArray, type HtmlSelectorItemType } from '@/lib/zod-extensions/types/html-selector-array';
import type { Element, Root } from 'hast';
import { select, selectAll } from 'hast-util-select';
import { toText } from 'hast-util-to-text';
import rehypeParse, { Options as RehypeParseOptions } from 'rehype-parse';
import { Processor, unified } from 'unified';
import { z } from 'zod';

export class HtmlLoader extends rag.Loader<HtmlLoader.Options, {}> {
  static identifier = 'rag.loader.html2';
  static displayName = 'HTML loader';

  private readonly processor: Processor<Root>;

  constructor (options: HtmlLoader.Options) {
    super(options);

    this.processor = unified()
      .use(rehypeParse, this.options.rehypeParse)
      .freeze();
  }

  load (buffer: Buffer, url: string): rag.Content<{}> {
    const { result, warning } = this.process(url, buffer);

    const content = result.map(item => item.content);

    return {
      content: content,
      digest: md5(content.join('\n\n\n\n')),
      metadata: {
        partitions: result.map(item => ({
          selector: item.selector,
          position: item.element.position,
        })),
        warning: warning.length ? warning : undefined,
      },
    } satisfies rag.Content<{}>;
  }

  support (mime: string): boolean {
    return /html/.test(mime);
  }

  private process (url: string, buffer: Buffer) {
    const selectors: HtmlSelectorItemType[] = [];

    for (let rule of (this.options.contentExtraction ?? [])) {
      const matcher = createUrlMatcher(rule.url);
      if (matcher(url)) {
        for (let selector of rule.selectors) {
          selectors.push(selector);
        }
      }
    }

    const failed: string[] = [];
    const warning: string[] = [];

    if (!selectors.length || !selectors.find(s => s.type == undefined || s.type == 'dom-text')) {
      selectors.push({ selector: 'body', all: false, type: 'dom-text' });
      warning.push('No content selector provided for this URL. the default selector `body` always contains redundancy content.');
    }

    const root = this.processor.parse(Uint8Array.from(buffer));

    const result: { content: string, selector: string, element: Element }[] = [];
    for (let { selector, all: multiple, type } of selectors) {
      if (multiple) {
        const elements = selectAll(selector, root);
        if (elements.length > 0) {
          result.push(...elements.map(element => ({
            content: getContent(element, type), selector, element,
          })));
        } else {
          failed.push(selector);
        }
      } else {
        const element = select(selector, root);
        if (element) {
          result.push({
            content: getContent(element, type), selector, element,
          });
        } else {
          failed.push(selector);
        }
      }
    }

    if (failed.length > 0) {
      warning.push(`Select element failed for selector(s): ${failed.map(selector => `\`${selector}\``).join(', ')}`);
    }

    return { result, failed, warning };
  }
}

function getContent (element: Element, type: HtmlSelectorItemType['type']) {
  if (type === 'dom-content-attr') {
    return String(element.properties['content'] ?? '');
  } else {
    return toText(element);
  }
}

export namespace HtmlLoader {
  const contentExtractionConfigSchema = z.object({
    url: z.string(),
    selectors: htmlSelectorArray(),
  }).array();

  export interface Options {
    rehypeParse?: RehypeParseOptions;
    contentExtraction?: z.infer<typeof contentExtractionConfigSchema>;
  }

  export const optionsSchema = z.object({
    rehypeParse: z.object({}).passthrough().optional(),
    contentExtraction: contentExtractionConfigSchema.optional(),
  });
}
