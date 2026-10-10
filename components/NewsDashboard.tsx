"use client";

import { useEffect, useState } from 'react';
import { 
  Newspaper, Loader2, Globe as GlobeIcon, Users, Landmark, Coins, 
  Volume2, Square, FastForward, Clock, Thermometer, Crosshair, 
  ExternalLink, Radar 
} from 'lucide-react';
import { playTypewriterSound } from '../utils/audio';
import { broadcastNews, stopBroadcast } from '../utils/speech';
import { GevView } from '@/types/gev';
import { buildArticleReconView } from '@/utils/reconDispatch';

export interface NewsArticle {
  title: string;
  description?: string;
  source?: { name: string };
  url: string;
  image?: string | null;
  publishedAt?: string;
  sentimentScore?: number;
  mentions?: string[];
}

const getWeatherString = (code: number) => {
  if (code === 0) return "CLEAR SKY";
  if (code <= 3) return "PARTLY CLOUDY";
  if (code <= 49) return "FOG / MIST";
  if (code <= 69) return "RAIN";
  if (code <= 79) return "SNOW";
  if (code <= 99) return "THUNDERSTORM";
  return "UNKNOWN";
};

const TypewriterText = ({ text, delay = 0, speed = 15 }: { text: string, delay?: number, speed?: number }) => {
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [prevText, setPrevText] = useState(text);

  if (text !== prevText) {
    setPrevText(text);
    setDisplayedText('');
    setIsTyping(false);
  }
  
  useEffect(() => {
    if (!text) return;

    let interval: NodeJS.Timeout;
    const timeout = setTimeout(() => {
      setIsTyping(true);
      let i = 0;
      interval = setInterval(() => {
        setDisplayedText(text.slice(0, i + 1));
        playTypewriterSound();
        i++;
        if (i >= text.length) {
          clearInterval(interval);
          setIsTyping(false);
        }
      }, speed);
    }, delay);
    
    return () => {
      clearTimeout(timeout);
      clearInterval(interval);
    };
  }, [text, delay, speed]);
  
  return (
    <span>
      {displayedText}
      {isTyping && <span className="animate-pulse bg-green-400 w-1.5 h-4 inline-block ml-0.5 align-middle"></span>}
    </span>
  );
};

let cachedCountriesData: any[] | null = null;

export default function NewsDashboard({ 
  country,
  province,
  searchQuery,
  onMentionsExtracted,
  showExpandBtn,
  onExpand,
  engineMode = 'strategic',
  onSelectReconTarget,
  activeTargetArticleUrl,
}: { 
  country: string;
  province?: string | null;
  searchQuery?: string;
  onMentionsExtracted?: (mentions: string[]) => void;
  showExpandBtn?: boolean;
  onExpand?: () => void;
  engineMode?: 'strategic' | 'recon';
  onSelectReconTarget?: (view: GevView, article: NewsArticle) => void;
  activeTargetArticleUrl?: string | null;
}) {
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [demographics, setDemographics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('general');
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
  const [localTime, setLocalTime] = useState<string>('00:00:00');
  const [weather, setWeather] = useState<{ temp: number, condition: string } | null>(null);

  const categories = ['general', 'finance', 'politics', 'technology'];

  // React 19 render-phase state adjustment when query or category changes
  const query = searchQuery || country;
  const currentQueryKey = `${query}:${category}`;
  const [prevQueryKey, setPrevQueryKey] = useState(currentQueryKey);
  if (currentQueryKey !== prevQueryKey) {
    setPrevQueryKey(currentQueryKey);
    setLoading(true);
  }

  // Clean up speech synthesis when component unmounts or changes country
  useEffect(() => {
    return () => {
      stopBroadcast();
      setIsBroadcasting(false);
    };
  }, [country]);

  // Fetch Demographic Data from local dataset (restcountries.com v3.1 is deprecated)
  useEffect(() => {
    const dataPromise = cachedCountriesData
      ? Promise.resolve(cachedCountriesData)
      : fetch('/countries-data.json').then(res => res.json()).then(data => { cachedCountriesData = data; return data; });

    dataPromise
      .then((allCountries: any[]) => {
        const match = allCountries.find((c: any) => 
          c.name?.common?.toLowerCase() === country.toLowerCase() ||
          c.name?.official?.toLowerCase() === country.toLowerCase()
        );
        if (match) {
          // Estimate timezone offset from longitude (1 hour per 15 degrees)
          const lng = match.latlng?.[1] ?? 0;
          const estimatedOffset = Math.round(lng / 15);
          const sign = estimatedOffset >= 0 ? '+' : '-';
          const absH = String(Math.abs(estimatedOffset)).padStart(2, '0');
          
          setDemographics({
            population: match.population || null,
            capital: match.capital || [],
            region: match.region || 'UNKNOWN',
            currencies: match.currencies || null,
            timezones: [`UTC${sign}${absH}:00`],
            capitalInfo: { latlng: match.latlng || null },
          });
        }
      })
      .catch(() => setDemographics(null));
  }, [country]);

  // Clock Effect
  useEffect(() => {
    if (!demographics || !demographics.timezones || demographics.timezones.length === 0) return;
    
    const tzStr = demographics.timezones[0];
    let offsetHours = 0;
    let offsetMinutes = 0;
    
    if (tzStr !== "UTC") {
      const match = tzStr.match(/UTC([+-])(\d{2}):(\d{2})/);
      if (match) {
        const sign = match[1] === '+' ? 1 : -1;
        offsetHours = parseInt(match[2], 10) * sign;
        offsetMinutes = parseInt(match[3], 10) * sign;
      }
    }

    const updateClock = () => {
      const now = new Date();
      const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
      const localDate = new Date(utc + (3600000 * offsetHours) + (60000 * offsetMinutes));
      setLocalTime(localDate.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };

    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, [demographics]);

  // Weather Effect
  useEffect(() => {
    let lat, lng;

    if (province) {
      // Use specific province capital/centroid coordinates
      const provinceCoords: Record<string, [number, number]> = {
        'Sindh': [24.8607, 67.0011], // Karachi
        'Punjab': [31.5204, 74.3587], // Lahore
        'Khyber Pakhtunkhwa': [34.0151, 71.5249], // Peshawar
        'Balochistan': [30.1798, 66.9750], // Quetta
        'Gilgit-Baltistan': [35.9208, 74.3083], // Gilgit
        'Azad Kashmir': [34.3700, 73.4711], // Muzaffarabad
        'Islamabad Capital Territory': [33.6844, 73.0479] // Islamabad
      };
      
      if (provinceCoords[province]) {
        [lat, lng] = provinceCoords[province];
      } else {
        // fallback to country capital if province not mapped somehow
        if (!demographics || !demographics.capitalInfo?.latlng) return;
        [lat, lng] = demographics.capitalInfo.latlng;
      }
    } else {
      if (!demographics || !demographics.capitalInfo?.latlng) return;
      [lat, lng] = demographics.capitalInfo.latlng;
    }
    
    const controller = new AbortController();
    fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,weather_code`, { signal: controller.signal })
      .then(res => res.json())
      .then(data => {
        if (data && data.current) {
          setWeather({
            temp: data.current.temperature_2m,
            condition: getWeatherString(data.current.weather_code)
          });
        }
      })
      .catch(e => {
        if (e.name !== 'AbortError') console.error(e);
      });
    return () => controller.abort();
  }, [demographics, province]);

  // Fetch News Data
  useEffect(() => {
    const activeQuery = searchQuery || country;
    const controller = new AbortController();
    fetch(`/api/news?country=${encodeURIComponent(activeQuery)}&category=${category}`, { signal: controller.signal })
      .then(res => res.json())
      .then(data => {
        setNews(data.articles || []);
        if (onMentionsExtracted) {
          onMentionsExtracted(data.mentions || []);
        }
        setLoading(false);
      })
      .catch((e) => {
        if (e.name === 'AbortError') return;
        setLoading(false);
        if (onMentionsExtracted) onMentionsExtracted([]);
      });
    return () => {
      controller.abort();
    };
  }, [country, searchQuery, category, onMentionsExtracted]);

  const handleBroadcast = () => {
    if (isBroadcasting) return;
    const headlines = news.map((article: NewsArticle) => article.title);

    broadcastNews(
      headlines, 
      playbackSpeed,
      () => setIsBroadcasting(true),
      () => setIsBroadcasting(false)
    );
  };

  const handleStop = () => {
    stopBroadcast();
    setIsBroadcasting(false);
  };

  const toggleSpeed = () => {
    const newSpeed = playbackSpeed === 1.0 ? 1.5 : playbackSpeed === 1.5 ? 2.0 : 1.0;
    setPlaybackSpeed(newSpeed);
    // If currently broadcasting, restart with new speed
    if (isBroadcasting) {
      stopBroadcast();
      setTimeout(() => {
        const headlines = news.map((article: NewsArticle) => article.title);
        broadcastNews(headlines, newSpeed, () => setIsBroadcasting(true), () => setIsBroadcasting(false));
      }, 100);
    }
  };

  const handleDispatchArticleRecon = (article: NewsArticle) => {
    const defaultCoords = (demographics?.capitalInfo?.latlng || demographics?.latlng) as [number, number] | undefined;
    const reconView = buildArticleReconView({
      title: article.title,
      description: article.description,
      sentimentScore: article.sentimentScore,
      country,
      province,
      mentions: article.mentions || [],
      defaultCoords,
    });

    if (onSelectReconTarget) {
      onSelectReconTarget(reconView, article);
    }
  };

  return (
    <div className="text-white">
      <div className="flex justify-between items-center mb-4 gap-2">
        <h2 className="text-2xl font-bold flex items-center gap-2 font-mono flex-1">
          <Newspaper className="w-6 h-6 text-green-400 shrink-0" />
          <TypewriterText text={searchQuery || country} speed={30} />
          {showExpandBtn && onExpand && (
            <button 
              type="button"
              onClick={onExpand}
              className="ml-2 text-xs bg-green-500/20 hover:bg-green-500/40 text-green-400 border border-green-500/50 px-2 py-1 rounded transition-all font-mono shadow-[0_0_10px_rgba(0,255,128,0.2)]"
            >
              EXPAND
            </button>
          )}
        </h2>
        {!loading && news.length > 0 && (
          <div className="flex items-center gap-2 shrink-0">
            <button 
              type="button"
              onClick={toggleSpeed}
              className="flex items-center gap-1 bg-black hover:bg-gray-800 text-gray-300 border border-gray-600 px-2 py-1.5 rounded transition-all font-mono text-xs shadow-[0_0_10px_rgba(255,255,255,0.05)]"
              title="Playback Speed"
            >
              <FastForward className="w-3 h-3" />
              {playbackSpeed}x
            </button>

            {isBroadcasting ? (
              <button 
                type="button"
                onClick={handleStop}
                className="flex items-center gap-1 bg-red-500/20 hover:bg-red-500/40 text-red-400 border border-red-500/50 px-2 py-1.5 rounded transition-all font-mono text-xs shadow-[0_0_10px_rgba(255,0,0,0.2)] animate-pulse"
              >
                <Square className="w-3 h-3 fill-current" />
                STOP
              </button>
            ) : (
              <button 
                type="button"
                onClick={handleBroadcast}
                className="flex items-center gap-1 bg-green-500/20 hover:bg-green-500/40 text-green-400 border border-green-500/50 px-2 py-1.5 rounded transition-all font-mono text-xs shadow-[0_0_10px_rgba(0,255,128,0.2)]"
              >
                <Volume2 className="w-4 h-4" />
                PLAY
              </button>
            )}
          </div>
        )}
      </div>

      {/* Demographic Intel HUD */}
      {demographics && (
        <div className="mb-6 bg-black/60 border border-green-500/30 p-4 rounded-lg shadow-[inset_0_0_15px_rgba(0,255,128,0.1)] font-mono text-xs relative overflow-hidden">
          {/* Animated scanning line */}
          <div className="absolute left-0 top-0 w-full h-0.5 bg-green-500/50 shadow-[0_0_10px_rgba(0,255,128,0.8)] opacity-50 animate-scan pointer-events-none"></div>

          <div className="flex justify-between items-start mb-3 border-b border-green-500/30 pb-2">
            <div className="text-green-500 tracking-widest font-bold">{"// SECURE_INTEL_LINK"}</div>
            <div className="flex items-center gap-2 text-green-400 bg-green-500/10 px-2 py-1 rounded border border-green-500/20">
              <Clock className="w-3.5 h-3.5 animate-pulse" />
              <span className="text-sm font-bold tracking-widest">{localTime}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-y-3 gap-x-4">
            <div className="flex items-center gap-2 text-gray-300">
              <Users className="w-3.5 h-3.5 text-green-400" />
              <span>POP: {demographics.population?.toLocaleString() || 'UNKNOWN'}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-300">
              <Landmark className="w-3.5 h-3.5 text-green-400" />
              <span>CAP: {province ? (
                province === 'Sindh' ? 'Karachi' :
                province === 'Punjab' ? 'Lahore' :
                province === 'Khyber Pakhtunkhwa' ? 'Peshawar' :
                province === 'Balochistan' ? 'Quetta' :
                province === 'Gilgit-Baltistan' ? 'Gilgit' :
                province === 'Azad Kashmir' ? 'Muzaffarabad' :
                province === 'Islamabad Capital Territory' ? 'Islamabad' : demographics.capital?.[0] || 'UNKNOWN'
              ) : (demographics.capital?.[0] || 'UNKNOWN')}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-300">
              <GlobeIcon className="w-3.5 h-3.5 text-green-400" />
              <span>REG: {demographics.region || 'UNKNOWN'}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-300">
              <Coins className="w-3.5 h-3.5 text-green-400" />
              <span>CUR: {demographics.currencies ? (Object.values(demographics.currencies)[0] as any)?.name : 'UNKNOWN'}</span>
            </div>
          </div>
          
          {/* Weather Section */}
          {weather && (
            <div className="mt-3 pt-3 border-t border-green-500/20 flex items-center justify-between">
              <div className="flex items-center gap-2 text-cyan-400">
                <Thermometer className="w-4 h-4" />
                <span className="font-bold text-sm">{weather.temp.toFixed(1)}°C</span>
              </div>
              <div className="text-cyan-500/80 tracking-widest uppercase text-[10px] font-bold">
                [ {weather.condition} ]
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* Category Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
        {categories.map((cat) => (
          <button
            type="button"
            key={cat}
            onClick={() => setCategory(cat)}
            className={`px-3 py-1.5 text-xs font-mono uppercase tracking-wider rounded border transition-colors whitespace-nowrap ${
              category === cat 
                ? 'bg-green-500/20 border-green-400 text-green-300 shadow-[0_0_10px_rgba(0,255,128,0.2)]' 
                : 'bg-black border-green-500/30 text-green-700 hover:text-green-400 hover:border-green-400'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>
      
      {loading ? (
        <div className="flex justify-center items-center py-10 font-mono text-green-400 text-sm">
          <Loader2 className="w-5 h-5 animate-spin mr-3" />
          <TypewriterText text="ESTABLISHING_SECURE_CONNECTION..." speed={30} delay={500} />
        </div>
      ) : (
        <div className="space-y-4">
          {news.length === 0 ? (
            <p className="text-gray-400 text-sm font-mono">
              <TypewriterText text="ERROR 404: NO_RECENT_TRANSMISSIONS_FOUND." />
            </p>
          ) : (
            news.map((article: NewsArticle, i: number) => {
              const score = article.sentimentScore || 0;
              const isPositive = score > 0;
              const isNegative = score < 0;
              const isTargeted = activeTargetArticleUrl === article.url;

              const borderClass = isTargeted
                ? 'border-cyan-400 shadow-[0_0_20px_rgba(0,255,255,0.4)] ring-1 ring-cyan-400'
                : isPositive 
                  ? 'border-green-500/50 shadow-[0_0_15px_rgba(0,255,128,0.2)]' 
                  : isNegative 
                    ? 'border-red-500/50 shadow-[0_0_15px_rgba(255,0,0,0.2)]' 
                    : 'border-blue-500/30 shadow-[0_0_15px_rgba(0,128,255,0.1)]';

              const barClass = isTargeted
                ? 'bg-cyan-400'
                : isPositive 
                  ? 'bg-green-500/50 group-hover:bg-green-400' 
                  : isNegative 
                    ? 'bg-red-500/50 group-hover:bg-red-400' 
                    : 'bg-blue-500/50 group-hover:bg-blue-400';

              const titleClass = isTargeted 
                ? 'text-cyan-200' 
                : isPositive 
                  ? 'text-green-100' 
                  : isNegative 
                    ? 'text-red-100' 
                    : 'text-blue-100';

              return (
                <div 
                  key={i} 
                  className={`block p-4 rounded-lg bg-black/90 hover:bg-white/5 transition border ${borderClass} group relative overflow-hidden`}
                >
                  {/* Cyberpunk accent bar based on sentiment or target */}
                  <div className={`absolute left-0 top-0 bottom-0 w-1 transition-colors ${barClass}`}></div>
                  
                  {/* Active target banner */}
                  {isTargeted && (
                    <div className="flex items-center gap-1.5 text-[10px] text-cyan-300 font-mono font-bold tracking-widest uppercase mb-2 bg-cyan-950/60 border border-cyan-500/40 px-2 py-0.5 rounded w-fit">
                      <Radar className="w-3 h-3 animate-spin text-cyan-400" />
                      LOCKED RECON TARGET // TELEMETRY ACTIVE
                    </div>
                  )}

                  {article.image && (
                    <div className="mb-3 w-full h-32 overflow-hidden rounded border border-green-500/20">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img 
                        src={article.image} 
                        alt={article.title} 
                        className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                        onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                      />
                    </div>
                  )}
                  
                  <h3 className={`font-bold text-sm mb-2 ${titleClass}`}>
                    <TypewriterText text={article.title} delay={i * 300} speed={10} />
                  </h3>
                  {article.source && (
                    <p className="text-xs text-gray-500 mb-2 font-mono uppercase tracking-wider flex justify-between">
                      <TypewriterText text={`SOURCE: ${article.source.name} | S-SCORE: ${score}`} delay={i * 300 + 200} speed={10} />
                      {article.publishedAt && (
                        <span className="text-gray-600">
                          <TypewriterText 
                            text={new Date(article.publishedAt).toLocaleDateString('en-GB', { 
                              day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' 
                            })} 
                            delay={i * 300 + 250} 
                            speed={10} 
                          />
                        </span>
                      )}
                    </p>
                  )}
                  {article.description && (
                    <p className="text-xs text-gray-400 leading-relaxed mb-3">
                      <TypewriterText text={article.description} delay={i * 300 + 400} speed={5} />
                    </p>
                  )}

                  {/* Actions Bar */}
                  <div className="flex items-center justify-between pt-2 border-t border-white/10 gap-2 font-mono text-xs">
                    <button
                      type="button"
                      onClick={() => handleDispatchArticleRecon(article)}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded font-bold tracking-wider transition ${
                        isTargeted
                          ? 'bg-cyan-500/30 text-cyan-300 border border-cyan-400'
                          : 'bg-cyan-950/40 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 hover:border-cyan-400'
                      }`}
                      title="Dispatch camera, telemetry, and sensor to God's Eye View"
                    >
                      <Crosshair className="w-3.5 h-3.5" />
                      <span>{isTargeted ? 'TARGETED' : engineMode === 'recon' ? 'TARGET SENSOR' : 'DISPATCH RECON'}</span>
                    </button>

                    <a
                      href={article.url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1 text-gray-400 hover:text-white transition text-[11px]"
                    >
                      <span>READ</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
