import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import remarkGfm from 'remark-gfm';

interface Props {
  content: string;
}

export function ReviewMarkdown({ content }: Props) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        h1: ({ children }) => (
          <h1 className="text-base font-semibold mt-4 mb-1.5 text-foreground">
            {children}
          </h1>
        ),
        h2: ({ children }) => (
          <h2 className="text-sm font-semibold mt-4 mb-1 text-foreground border-b border-border pb-1">
            {children}
          </h2>
        ),
        h3: ({ children }) => (
          <h3 className="text-sm font-medium mt-3 mb-1 text-foreground">
            {children}
          </h3>
        ),
        p: ({ children }) => (
          <p className="text-sm leading-relaxed mb-2 text-foreground/90">
            {children}
          </p>
        ),
        ul: ({ children }) => (
          <ul className="text-sm space-y-0.5 mb-2 pl-4 list-disc marker:text-muted-foreground">
            {children}
          </ul>
        ),
        ol: ({ children }) => (
          <ol className="text-sm space-y-0.5 mb-2 pl-4 list-decimal marker:text-muted-foreground">
            {children}
          </ol>
        ),
        li: ({ children }) => (
          <li className="text-sm leading-relaxed text-foreground/90">
            {children}
          </li>
        ),
        code({ className, children, ...rest }) {
          const match = /language-(\w+)/.exec(className || '');
          const isInline = !match && !String(children).includes('\n');
          if (isInline) {
            return (
              <code
                className="text-xs font-mono bg-muted text-foreground px-1 py-0.5 rounded"
                {...rest}
              >
                {children}
              </code>
            );
          }
          return (
            <SyntaxHighlighter
              style={oneDark}
              language={match?.[1] ?? 'tsx'}
              PreTag="div"
              wrapLines={true}
              wrapLongLines={true}
              customStyle={{
                margin: '0 0 8px 0',
                borderRadius: '6px',
                fontSize: '12px',
                lineHeight: '1.6',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-all',
              }}
            >
              {String(children).replace(/\n$/, '')}
            </SyntaxHighlighter>
          );
        },
        table: ({ children }) => (
          <div className="overflow-x-auto mb-3 rounded border border-border">
            <table className="text-xs w-full border-collapse">{children}</table>
          </div>
        ),
        thead: ({ children }) => (
          <thead className="bg-muted/60">{children}</thead>
        ),
        tbody: ({ children }) => (
          <tbody className="divide-y divide-border/50">{children}</tbody>
        ),
        th: ({ children }) => (
          <th className="text-left font-semibold px-3 py-2 text-foreground/80 whitespace-nowrap">
            {children}
          </th>
        ),
        td: ({ children }) => (
          <td className="px-3 py-2 align-top text-foreground/80">{children}</td>
        ),
        strong: ({ children }) => (
          <strong className="font-semibold text-foreground">{children}</strong>
        ),
        blockquote: ({ children }) => (
          <blockquote className="border-l-2 border-border pl-3 my-2 text-sm text-muted-foreground italic">
            {children}
          </blockquote>
        ),
        hr: () => <hr className="border-border my-3" />,
      }}
    >
      {content}
    </ReactMarkdown>
  );
}
