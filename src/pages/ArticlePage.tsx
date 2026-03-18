import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Link as LinkIcon, Clock, Twitter, Linkedin, ArrowUp } from 'lucide-react';
import { motion } from 'motion/react';
import { articles } from '../data/articles';
import { cn } from '../lib/utils';
import { useToast } from '../hooks/useToast';

const TOC_ITEMS = [
  { id: 'introduction', title: 'Introduction' },
  { id: 'key-takeaways', title: 'Key Takeaways' },
  { id: 'deep-dive', title: 'Deep Dive' },
  { id: 'future-outlook', title: 'Future Outlook' },
  { id: 'conclusion', title: 'Conclusion' },
];

export default function ArticlePage() {
  const { id } = useParams();
  const { addToast } = useToast();
  const article = articles.find(a => a.id === id) || articles[0];
  const [activeId, setActiveId] = useState(TOC_ITEMS[0].id);
  const [showBackToTop, setShowBackToTop] = useState(false);

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    addToast('Link copied!', 2000);
  };

  const relatedArticles = articles
    .filter(a => a.id !== article.id)
    .sort((a, b) => (a.category === article.category ? -1 : 1))
    .slice(0, 3);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  useEffect(() => {
    const visibleSections = new Set<string>();
    
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            visibleSections.add(entry.target.id);
          } else {
            visibleSections.delete(entry.target.id);
          }
        });
        
        const firstVisible = TOC_ITEMS.find(item => visibleSections.has(item.id));
        if (firstVisible) {
          setActiveId(firstVisible.id);
        }
      },
      { rootMargin: '-100px 0px -60% 0px' }
    );

    TOC_ITEMS.forEach(({ id }) => {
      const element = document.getElementById(id);
      if (element) observer.observe(element);
    });

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 500);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="max-w-7xl mx-auto border-x border-zinc-200 min-h-screen bg-white">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 p-6 sm:p-10 lg:p-16">
        <div className="flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono font-semibold text-zinc-400 uppercase tracking-wider mb-6">
              <span>//</span>
              <span>{article.category}</span>
            </div>
            
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-display font-medium tracking-tight text-zinc-900 leading-[1.1]">
              {article.title}
            </h1>
          </div>
          
          <div className="text-xs font-mono font-semibold text-zinc-400 uppercase tracking-wider mt-12 lg:mt-0">
            {article.date}
          </div>
        </div>
        
        <div className="w-full h-full min-h-[300px] lg:min-h-[400px] bg-zinc-100">
          <img 
            src={article.imageUrl} 
            alt={article.title}
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        </div>
      </div>

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 px-6 sm:px-10 lg:px-16 py-4 border-y border-zinc-200">
        <div className="flex items-center gap-4">
          <div className="flex gap-1.5">
            {article.authors.map((author, i) => (
              <img 
                key={i} 
                src={author.avatarUrl} 
                alt={author.name} 
                className="w-9 h-9 object-cover bg-zinc-100"
                referrerPolicy="no-referrer"
              />
            ))}
          </div>
          <div className="text-xs font-mono font-medium text-zinc-600 uppercase tracking-wider leading-relaxed max-w-md">
            {article.authors.map(a => a.name).join(', ')}
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-xs font-mono font-medium text-zinc-400 uppercase tracking-wider">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            <span>{article.readTime}</span>
          </div>
          <div className="flex items-center gap-2">
            <a
              href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(article.title)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2.5 border border-zinc-200 hover:bg-zinc-50 transition-colors text-zinc-700"
            >
              <Twitter className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Share</span>
            </a>
            <a
              href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2.5 border border-zinc-200 hover:bg-zinc-50 transition-colors text-zinc-700"
            >
              <Linkedin className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Share</span>
            </a>
            <button 
              onClick={copyLink}
              className="flex items-center gap-2 px-4 py-2.5 border border-zinc-200 hover:bg-zinc-50 transition-colors text-zinc-700"
            >
              <LinkIcon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Copy Link</span>
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row relative border-b border-zinc-200">
        <div className="hidden md:block w-64 lg:w-72 shrink-0 border-r border-zinc-200 py-8 sm:py-12 lg:py-16 pl-6 sm:pl-10 lg:pl-16 pr-8 lg:pr-12">
          <div className="sticky top-24">
            <div className="relative border-l border-zinc-200">
              <ul className="text-[14.5px] font-sans">
                {TOC_ITEMS.map((item) => {
                  const isActive = activeId === item.id;
                  return (
                    <li key={item.id} className="relative">
                      <a 
                        href={`#${item.id}`} 
                        className={cn(
                          "block pl-4 py-2 transition-colors",
                          isActive ? "text-zinc-900 font-medium" : "text-zinc-500 hover:text-zinc-900"
                        )}
                      >
                        {item.title}
                      </a>
                      {isActive && (
                        <motion.div
                          layoutId="toc-highlighter"
                          className="absolute left-0 top-0 bottom-0 w-[2px] bg-zinc-900 -ml-px"
                          initial={false}
                          transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        />
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        </div>

        <div className="grow py-8 sm:py-12 lg:py-16 px-6 sm:px-10 lg:px-16 md:pl-8 lg:pl-12 prose prose-zinc prose-lg max-w-none prose-headings:font-display prose-headings:font-medium prose-headings:tracking-tight prose-a:text-blue-600 hover:prose-a:text-blue-700 prose-img:rounded-none">
          <p className="lead text-xl text-zinc-600 mb-10">
            The tech landscape is evolving faster than ever. In this comprehensive overview, we break down the most significant developments and what they mean for the future of the industry. <em>Stay informed.</em>
          </p>

          <h2 id="introduction">Introduction</h2>
          <p>
            As we move further into 2026, the convergence of artificial intelligence, advanced hardware, and new web paradigms is creating unprecedented opportunities and challenges. Companies are racing to adapt to a reality where AI is no longer just a feature, but the foundation of new products.
          </p>
          <p>This shift requires a fundamental rethinking of how we build, deploy, and scale applications:</p>
          <ul>
            <li><strong>AI-First Architecture:</strong> Designing systems with machine learning models at their core.</li>
            <li><strong>Edge Computing:</strong> Pushing processing closer to the user for lower latency.</li>
            <li><strong>Security by Default:</strong> Implementing zero-trust frameworks across all layers.</li>
          </ul>

          <h2 id="key-takeaways">Key Takeaways</h2>
          <p>
            Our analysis of recent industry trends reveals several critical insights that developers and tech leaders need to understand:
          </p>
          <blockquote>
            "The companies that succeed in the next decade won't just use AI; they will be fundamentally restructured around it." — TechWire Analysis
          </blockquote>

          <h2 id="deep-dive">Deep Dive</h2>
          <p>
            Let's look at the numbers. Recent benchmarks show a massive improvement in processing efficiency for large language models, reducing the cost of inference by over 60% compared to last year. This democratization of AI capabilities means smaller teams can now build features that previously required massive engineering organizations.
          </p>
          
          <pre><code>{`// Example of a modern API integration
async function fetchInsights() {
  const response = await fetch('https://api.techwire.dev/v1/insights', {
    headers: {
      'Authorization': \`Bearer \${process.env.API_KEY}\`,
      'Content-Type': 'application/json'
    }
  });
  
  return response.json();
}`}</code></pre>

          <h2 id="future-outlook">Future Outlook</h2>
          <p>
            Looking ahead, we expect to see continued consolidation in the tooling space. Developers are tired of configuring complex build pipelines and are migrating towards unified, zero-config toolchains that "just work."
          </p>

          <h2 id="conclusion">Conclusion</h2>
          <p>
            The pace of innovation isn't slowing down. To stay competitive, teams must remain agile, continuously evaluate their tech stacks, and be willing to adopt new paradigms when they offer clear advantages.
          </p>
        </div>
      </div>

      <div className="border-b border-zinc-200">
        <div className="px-6 sm:px-10 lg:px-16 py-12 border-b border-zinc-200">
          <h2 className="text-2xl font-display font-bold tracking-tight text-zinc-900">Related Articles</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-0">
          {relatedArticles.map((relatedArticle, index) => (
            <Link key={relatedArticle.id} to={`/article/${relatedArticle.id}`} className={cn(
              "group flex flex-col h-full hover:bg-zinc-50 transition-colors",
              index !== 2 ? "md:border-r border-zinc-200" : "",
              index !== 0 ? "border-t md:border-t-0 border-zinc-200" : ""
            )}>
              <div className="p-6 md:p-8 grow">
                <div className="aspect-video rounded-none overflow-hidden bg-zinc-100 mb-6 border border-zinc-200">
                  <img 
                    src={relatedArticle.imageUrl} 
                    alt={relatedArticle.title}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="flex items-center gap-2 text-[11px] font-mono text-zinc-500 uppercase tracking-widest mb-3">
                  <span>// {relatedArticle.category}</span>
                </div>
                <h3 className="text-xl font-display font-bold tracking-tight text-zinc-900 mb-4">
                  {relatedArticle.title}
                </h3>
              </div>
              <div className="border-t border-zinc-200 p-4 px-6 md:p-8 flex items-center justify-between mt-auto">
                <div className="flex -space-x-2">
                  {relatedArticle.authors.map((author, i) => (
                    <img 
                      key={i} 
                      src={author.avatarUrl} 
                      alt={author.name} 
                      className="w-6 h-6 rounded-none border border-zinc-200"
                      referrerPolicy="no-referrer"
                    />
                  ))}
                </div>
                <div className="text-[11px] font-mono text-zinc-500 uppercase tracking-widest">
                  {relatedArticle.date}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      <div className="w-full bg-zinc-950 py-16 px-6 sm:px-10 lg:px-16 flex flex-col md:flex-row items-center justify-between gap-8 text-white">
        <div className="md:w-1/2">
          <h3 className="text-3xl md:text-4xl font-display font-bold tracking-tight mb-4">Never miss an update</h3>
          <p className="text-zinc-400 font-mono text-xs uppercase tracking-widest">Join 50,000+ developers getting our weekly tech insights.</p>
        </div>
        <div className="w-full md:w-1/2">
          <form className="flex flex-col sm:flex-row gap-0 border border-zinc-700" onSubmit={(e) => e.preventDefault()}>
            <input 
              type="email" 
              placeholder="YOUR EMAIL ADDRESS" 
              autoComplete="off"
              className="bg-zinc-900 border-none rounded-none px-4 py-4 grow text-white focus:outline-none focus:ring-0 text-xs font-mono uppercase tracking-widest placeholder:text-zinc-500 w-full"
            />
            <button 
              type="submit" 
              className="bg-white text-zinc-900 px-8 py-4 rounded-none font-mono text-xs font-bold uppercase tracking-widest hover:bg-zinc-200 transition-colors border-t sm:border-t-0 sm:border-l border-zinc-700 whitespace-nowrap w-full sm:w-auto"
            >
              Subscribe
            </button>
          </form>
        </div>
      </div>

      {showBackToTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 w-12 h-12 bg-zinc-900 text-white flex items-center justify-center shadow-lg hover:bg-zinc-800 transition-colors z-50"
          aria-label="Back to top"
        >
          <ArrowUp className="w-5 h-5" />
        </button>
      )}
    </div>
  );
}
