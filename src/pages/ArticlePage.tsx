import { useParams, Link } from 'react-router-dom';
import { articles } from '../data/articles';
import { Link as LinkIcon, Clock, ChevronDown } from 'lucide-react';

export default function ArticlePage() {
  const { id } = useParams();
  const article = articles.find(a => a.id === id) || articles[0]; // Fallback to first for demo

  return (
    <div className="max-w-7xl mx-auto border-x border-zinc-200 min-h-screen bg-white">
      {/* Article Header */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 p-6 sm:p-10 lg:p-16">
        <div className="flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono font-semibold text-zinc-400 uppercase tracking-wider mb-6">
              <span>//</span>
              <span>{article.category}</span>
            </div>
            
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-medium tracking-tight text-zinc-900 leading-[1.1]">
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

      {/* Meta Bar */}
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
        
        <div className="flex items-center gap-6 text-xs font-mono font-medium text-zinc-400 uppercase tracking-wider">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            <span>{article.readTime}</span>
          </div>
          <div className="flex items-center">
            <button className="flex items-center gap-2 px-4 py-2.5 border border-zinc-200 hover:bg-zinc-50 transition-colors text-zinc-700">
              <LinkIcon className="w-3.5 h-3.5" />
              Copy Link
            </button>
            <button className="px-2.5 py-2.5 border-y border-r border-zinc-200 hover:bg-zinc-50 transition-colors text-zinc-700">
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Article Body Layout */}
      <div className="flex flex-col md:flex-row gap-16 p-6 sm:p-10 lg:p-16 relative">
        {/* Sidebar TOC */}
        <div className="hidden md:block w-56 shrink-0">
          <div className="sticky top-24">
            <ul className="text-[14.5px] font-sans border-l border-zinc-200">
              <li><a href="#what-is-vite" className="block pl-4 py-2 text-zinc-500 hover:text-zinc-900 transition-colors border-l -ml-[1px] border-transparent">What is Vite+?</a></li>
              <li><a href="#performance" className="block pl-4 py-2 text-zinc-500 hover:text-zinc-900 transition-colors border-l -ml-[1px] border-transparent">Performance & Scale</a></li>
              <li><a href="#getting-started" className="block pl-4 py-2 text-zinc-500 hover:text-zinc-900 transition-colors border-l -ml-[1px] border-transparent">Getting Started</a></li>
              <li><a href="#macos-linux" className="block pl-4 py-2 text-zinc-500 hover:text-zinc-900 transition-colors border-l -ml-[1px] border-transparent">macOS / Linux</a></li>
              <li><a href="#windows" className="block pl-4 py-2 text-zinc-500 hover:text-zinc-900 transition-colors border-l -ml-[1px] border-transparent">Windows (PowerShell)</a></li>
              <li><a href="#ci" className="block pl-4 py-2 text-zinc-500 hover:text-zinc-900 transition-colors border-l -ml-[1px] border-transparent">CI</a></li>
              <li><a href="#using-vite" className="block pl-4 py-2 text-zinc-500 hover:text-zinc-900 transition-colors border-l -ml-[1px] border-transparent">Using Vite+</a></li>
              <li><a href="#vite-task" className="block pl-4 py-2 text-zinc-500 hover:text-zinc-900 transition-colors border-l -ml-[1px] border-transparent">Vite Task</a></li>
              <li><a href="#migrating" className="block pl-4 py-2 text-zinc-500 hover:text-zinc-900 transition-colors border-l -ml-[1px] border-transparent">Migrating a Project to Vite+</a></li>
              <li><a href="#mit-license" className="block pl-4 py-2 text-zinc-900 font-medium transition-colors border-l -ml-[1px] border-black">MIT License</a></li>
              <li><a href="#next-steps" className="block pl-4 py-2 text-zinc-500 hover:text-zinc-900 transition-colors border-l -ml-[1px] border-transparent">Next Steps</a></li>
            </ul>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-grow prose prose-zinc prose-lg max-w-none prose-headings:font-medium prose-headings:tracking-tight prose-a:text-blue-600 hover:prose-a:text-blue-700 prose-img:rounded-none">
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

      {/* Newsletter Section embedded in article */}
      <div className="mx-6 sm:mx-10 lg:mx-16 mb-16 bg-zinc-900 p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-8 text-white">
        <div className="md:w-1/2">
          <h3 className="text-3xl font-medium tracking-tight mb-4">Never miss an update</h3>
          <p className="text-zinc-400 text-lg">Join 50,000+ developers getting our weekly tech insights.</p>
        </div>
        <div className="w-full md:w-1/2">
          <form className="flex flex-col sm:flex-row gap-3">
            <input 
              type="email" 
              placeholder="Enter your email" 
              className="bg-zinc-800 border border-zinc-700 px-4 py-3 flex-grow text-white focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:border-transparent transition-all"
            />
            <button 
              type="submit" 
              className="bg-white text-zinc-900 px-8 py-3 font-bold hover:bg-zinc-200 transition-colors whitespace-nowrap"
            >
              Subscribe
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
