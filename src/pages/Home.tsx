import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { articles } from '../data/articles';
import { cn } from '../lib/utils';
import { Logo } from '../components/Logo';

const CATEGORIES = ['All', 'AI & ML', 'Web Dev', 'Hardware', 'Industry'];

export default function Home() {
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const featuredArticle = articles[0];
  const secondaryFeatured = articles.slice(1, 3);
  
  const filteredArticles = articles.filter(article => {
    const matchesCategory = activeCategory === 'All' || article.category === activeCategory;
    const matchesSearch = article.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="w-full pb-16">
      {/* Hero Section */}
      <div className="border-b border-zinc-200 grid grid-cols-1 lg:grid-cols-3 mb-16">
        <div className="lg:col-span-2 border-b lg:border-b-0 lg:border-r border-zinc-200 flex flex-col group cursor-pointer hover:bg-zinc-50 transition-colors">
          <Link to={`/article/${featuredArticle.id}`} className="flex flex-col h-full">
            <div className="p-6 md:p-8 grow">
              <div className="rounded-none overflow-hidden mb-8 aspect-video bg-zinc-100 relative border border-zinc-200">
                <img 
                  src={featuredArticle.imageUrl} 
                  alt={featuredArticle.title}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="flex items-center gap-2 text-[11px] font-mono text-zinc-500 uppercase tracking-widest mb-4">
                <span>// {featuredArticle.category}</span>
              </div>
              <h1 className="text-3xl md:text-5xl font-display font-bold tracking-tight text-zinc-900 mb-6">
                {featuredArticle.title}
              </h1>
            </div>
            <div className="border-t border-zinc-200 p-4 px-6 md:px-8 flex items-center gap-4 text-xs font-mono text-zinc-500">
              <div className="flex -space-x-2">
                {featuredArticle.authors.map((author, i) => (
                  <img 
                    key={i} 
                    src={author.avatarUrl} 
                    alt={author.name} 
                    className="w-8 h-8 rounded-none border border-zinc-200"
                    referrerPolicy="no-referrer"
                  />
                ))}
              </div>
              <span className="text-zinc-900 font-medium">
                {featuredArticle.authors.map(a => a.name).join(', ')}
              </span>
              <span className="ml-auto uppercase tracking-widest">{featuredArticle.date}</span>
            </div>
          </Link>
        </div>
        
        <div className="flex flex-col">
          {secondaryFeatured.map((article, index) => (
            <Link key={article.id} to={`/article/${article.id}`} className={cn(
              "group flex flex-col flex-1 hover:bg-zinc-50 transition-colors",
              index === 0 ? "border-b border-zinc-200" : ""
            )}>
              <div className="p-6 md:p-8 grow">
                <div className="rounded-none overflow-hidden mb-6 aspect-video bg-zinc-100 relative border border-zinc-200">
                  <img 
                    src={article.imageUrl} 
                    alt={article.title}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="flex items-center gap-2 text-[11px] font-mono text-zinc-500 uppercase tracking-widest mb-3">
                  <span>// {article.category}</span>
                </div>
                <h3 className="text-xl font-display font-bold tracking-tight text-zinc-900 mb-4">
                  {article.title}
                </h3>
                <div className="mt-auto pt-4 text-[11px] font-mono text-zinc-500 uppercase tracking-widest">
                  {article.date}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* All Articles Section */}
      <div className="px-6 md:px-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div className="flex items-center gap-0 overflow-x-auto w-full md:w-auto hide-scrollbar border border-zinc-200">
            {CATEGORIES.map((category, index) => (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
                className={cn(
                  "px-6 py-3 text-xs font-mono uppercase tracking-widest whitespace-nowrap transition-colors",
                  index !== 0 ? "border-l border-zinc-200" : "",
                  activeCategory === category 
                    ? "bg-zinc-900 text-white" 
                    : "bg-white text-zinc-600 hover:bg-zinc-50"
                )}
              >
                {category}
              </button>
            ))}
          </div>
          
          <div className="relative w-full md:w-64 border border-zinc-200">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input 
              type="text" 
              placeholder="SEARCH ARTICLES..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-none bg-white border-none focus:ring-0 text-xs font-mono uppercase tracking-widest placeholder:text-zinc-400 outline-none"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-0 border-t border-zinc-200">
        {filteredArticles.map((article, index) => (
          <Link key={article.id} to={`/article/${article.id}`} className={cn(
            "group flex flex-col h-full border-b border-zinc-200 hover:bg-zinc-50 transition-colors",
            index % 2 === 0 ? "md:border-r" : "md:border-r-0",
            (index + 1) % 3 !== 0 ? "lg:border-r" : "lg:border-r-0"
          )}>
            <div className="p-6 md:p-8 grow">
              <div className="aspect-video rounded-none overflow-hidden bg-zinc-100 mb-6 border border-zinc-200">
                <img 
                  src={article.imageUrl} 
                  alt={article.title}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="flex items-center gap-2 text-[11px] font-mono text-zinc-500 uppercase tracking-widest mb-3">
                <span>// {article.category}</span>
              </div>
              <h3 className="text-xl font-display font-bold tracking-tight text-zinc-900 mb-4">
                {article.title}
              </h3>
            </div>
            <div className="border-t border-zinc-200 p-4 px-6 md:px-8 flex items-center justify-between mt-auto">
              <div className="flex -space-x-2">
                {article.authors.map((author, i) => (
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
                {article.date}
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Pagination */}
      <div className="flex justify-center items-center gap-0 mt-16 text-sm font-mono border border-zinc-200 w-fit mx-auto">
        <button className="p-3 text-zinc-400 hover:text-zinc-900 transition-colors border-r border-zinc-200 hover:bg-zinc-50" disabled>
          <ChevronLeft className="w-4 h-4" />
        </button>
        <button className="w-10 h-10 flex items-center justify-center rounded-none bg-zinc-900 text-white border-r border-zinc-200">1</button>
        <button className="w-10 h-10 flex items-center justify-center rounded-none text-zinc-500 hover:bg-zinc-50 transition-colors border-r border-zinc-200">2</button>
        <button className="w-10 h-10 flex items-center justify-center rounded-none text-zinc-500 hover:bg-zinc-50 transition-colors border-r border-zinc-200">3</button>
        <button className="p-3 text-zinc-400 hover:text-zinc-900 transition-colors hover:bg-zinc-50">
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
