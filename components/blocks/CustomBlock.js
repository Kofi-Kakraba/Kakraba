import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

// Link that works for both site pages (/shop) and outside addresses (https://...).
function SmartLink({ href, className, children }) {
  if (!href) return <div className={className}>{children}</div>;
  if (href.startsWith('/')) return <Link href={href} className={className}>{children}</Link>;
  return <a href={href} target="_blank" rel="noopener noreferrer" className={className}>{children}</a>;
}

const Eyebrow = ({ children, tone = 'emerald' }) =>
  children ? (
    <div className={`text-[11px] font-black tracking-widest uppercase flex items-center gap-2 ${tone === 'rose' ? 'text-rose-500' : 'text-emerald-500'}`}>
      <span className={`w-8 h-0.5 ${tone === 'rose' ? 'bg-rose-500' : 'bg-emerald-500'}`}></span> {children}
    </div>
  ) : null;

const BANNER_STYLES = {
  rose: 'bg-gradient-to-br from-rose-600 to-rose-500 text-white',
  emerald: 'bg-gradient-to-br from-emerald-700 to-emerald-500 text-white',
  amber: 'bg-gradient-to-br from-amber-500 to-amber-400 text-stone-950',
  dark: 'bg-stone-950 text-white',
};

export default function CustomBlock({ block }) {
  switch (block.type) {
    case 'textimage': {
      const dark = block.theme === 'dark';
      const paragraphs = (block.body || '').split(/\n\s*\n/).filter(Boolean);
      return (
        <section className={dark ? 'bg-[#111111] text-white py-20' : 'py-20'}>
          <div className="max-w-7xl mx-auto px-4 md:px-8 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className={`space-y-6 ${block.imageSide === 'left' ? 'md:order-2' : ''}`}>
              <Eyebrow>{block.eyebrow}</Eyebrow>
              {block.heading && <h2 className="text-4xl md:text-5xl font-black tracking-tighter uppercase">{block.heading}</h2>}
              {paragraphs.length > 0 && (
                <div className={`space-y-4 text-sm md:text-base leading-relaxed font-medium ${dark ? 'text-stone-400' : 'text-stone-500'}`}>
                  {paragraphs.map((p, i) => <p key={i}>{p}</p>)}
                </div>
              )}
              {block.buttonLabel && block.buttonLink && (
                <SmartLink href={block.buttonLink} className={`inline-flex items-center gap-2 rounded-full px-6 py-3 text-[11px] font-black uppercase tracking-widest transition-colors ${dark ? 'bg-white text-stone-950 hover:bg-stone-200' : 'bg-stone-950 text-white hover:bg-stone-800'}`}>
                  {block.buttonLabel} <ArrowRight className="h-4 w-4" />
                </SmartLink>
              )}
            </div>
            {block.imageUrl && (
              <div className={`relative rounded-[40px] overflow-hidden bg-stone-100 h-[360px] md:h-[440px] shadow-[0_8px_30px_rgb(0,0,0,0.06)] ${block.imageSide === 'left' ? 'md:order-1' : ''}`}>
                <img src={block.imageUrl} alt={block.heading || ''} loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
              </div>
            )}
          </div>
        </section>
      );
    }

    case 'banner':
      return (
        <section className="max-w-7xl mx-auto px-4 md:px-8 py-12">
          <div className={`rounded-[40px] px-8 py-14 md:px-16 text-center space-y-4 shadow-xl ${BANNER_STYLES[block.color] || BANNER_STYLES.rose}`}>
            {block.heading && <h2 className="text-3xl md:text-5xl font-black tracking-tighter uppercase">{block.heading}</h2>}
            {block.subtext && <p className="mx-auto max-w-2xl text-sm md:text-base font-medium opacity-90">{block.subtext}</p>}
            {block.buttonLabel && block.buttonLink && (
              <div className="pt-2">
                <SmartLink href={block.buttonLink} className={`inline-flex items-center gap-2 rounded-full px-7 py-3 text-[11px] font-black uppercase tracking-widest shadow-lg transition-transform hover:-translate-y-0.5 ${block.color === 'dark' ? 'bg-white text-stone-950' : block.color === 'amber' ? 'bg-stone-950 text-white' : 'bg-white text-stone-950'}`}>
                  {block.buttonLabel} <ArrowRight className="h-4 w-4" />
                </SmartLink>
              </div>
            )}
          </div>
        </section>
      );

    case 'cards': {
      const cards = block.cards || [];
      const cols = cards.length >= 3 ? 'md:grid-cols-3' : cards.length === 2 ? 'md:grid-cols-2' : 'md:grid-cols-1 max-w-xl mx-auto';
      return (
        <section className="max-w-7xl mx-auto px-6 md:px-12 py-16">
          {(block.heading || block.subheading) && (
            <div className="text-center mb-12 space-y-4">
              {block.heading && <h2 className="text-4xl md:text-5xl font-black tracking-tighter uppercase text-stone-950">{block.heading}</h2>}
              {block.subheading && <p className="text-stone-500 font-medium max-w-xl mx-auto text-sm">{block.subheading}</p>}
            </div>
          )}
          <div className={`grid grid-cols-1 gap-6 ${cols}`}>
            {cards.map((c, i) => (
              <SmartLink key={i} href={c.link} className="group relative block rounded-[40px] overflow-hidden bg-stone-200 h-96 shadow-xl hover:-translate-y-2 transition-transform duration-500">
                {c.imageUrl && <img src={c.imageUrl} alt={c.title || ''} loading="lazy" className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" />}
                <div className="absolute inset-0 bg-gradient-to-t from-stone-950/90 via-stone-950/20 to-transparent flex flex-col justify-end p-8">
                  {c.title && <h3 className="text-white font-black uppercase text-2xl tracking-tighter">{c.title}</h3>}
                  {c.label && <p className="text-rose-400 text-[10px] font-bold uppercase tracking-widest mt-1">{c.label}</p>}
                </div>
              </SmartLink>
            ))}
          </div>
        </section>
      );
    }

    case 'photogallery':
      return (
        <section className="bg-[#111111] text-white py-24 border-t border-stone-900">
          <div className="max-w-7xl mx-auto px-4 md:px-8 space-y-12">
            {(block.eyebrow || block.heading) && (
              <div className="flex flex-col items-start gap-4 border-b border-stone-800 pb-8">
                <Eyebrow tone="rose">{block.eyebrow}</Eyebrow>
                {block.heading && <h2 className="text-4xl md:text-5xl font-black tracking-tighter text-white uppercase">{block.heading}</h2>}
              </div>
            )}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {(block.items || []).map((it, i) => (
                <SmartLink key={i} href={it.link} className="group block">
                  <div className="aspect-[4/5] w-full relative overflow-hidden rounded-[32px] bg-stone-900 mb-3 border-2 border-transparent group-hover:border-rose-500 shadow-lg transition-colors duration-300">
                    {it.imageUrl
                      ? <img src={it.imageUrl} alt={it.caption || ''} loading="lazy" className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                      : <div className="w-full h-full flex items-center justify-center text-[10px] text-stone-700 font-black uppercase">No image</div>}
                  </div>
                  {it.caption && <h3 className="text-white font-black uppercase text-xs tracking-widest group-hover:text-rose-500 transition-colors">{it.caption}</h3>}
                </SmartLink>
              ))}
            </div>
          </div>
        </section>
      );

    case 'faq':
      return (
        <section className="max-w-3xl mx-auto px-6 py-16">
          {block.heading && <h2 className="text-3xl md:text-4xl font-black tracking-tighter uppercase text-stone-950 mb-8 text-center">{block.heading}</h2>}
          <div className="space-y-3">
            {(block.items || []).map((it, i) => (
              <details key={i} className="group rounded-2xl border border-stone-200 bg-white px-5 py-4 shadow-sm">
                <summary className="cursor-pointer list-none flex items-center justify-between gap-4 font-black text-sm uppercase tracking-wide text-stone-900">
                  <span>{it.q}</span>
                  <span className="text-emerald-500 text-lg transition-transform group-open:rotate-45">+</span>
                </summary>
                {it.a && <p className="mt-3 text-sm leading-relaxed text-stone-500 font-medium whitespace-pre-line">{it.a}</p>}
              </details>
            ))}
          </div>
        </section>
      );

    default:
      return null;
  }
}
